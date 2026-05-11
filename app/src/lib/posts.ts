// Row<->domain mappers and the local post repository (writes go to Dexie,
// scheduleSync() pushes to Supabase on idle).

import { db } from "@/lib/db";
import { scheduleSync } from "@/lib/sync";
import type { Post, PostStatus } from "@/types";

export interface PostRow {
  id: number;
  title: string;
  slug: string;
  type: string;
  status: PostStatus | null;
  published_at: string | null;
  excerpt: string | null;
  category: string | null;
  content_md: string | null;
  notion_id: string | null;
  favorited: boolean;
  collection_seq: number | null;
  word_count: number | null;
  created_at: string;
  updated_at: string;
}

const isoToMs = (s: string | null): number | null => (s ? new Date(s).getTime() : null);
const msToIso = (n: number | null): string | null => (n ? new Date(n).toISOString() : null);

export function fromRow(r: PostRow): Post {
  return {
    id: r.id,
    title: r.title ?? "",
    slug: r.slug ?? "",
    type: r.type,
    status: r.status,
    publishedAt: isoToMs(r.published_at),
    excerpt: r.excerpt,
    category: r.category,
    content: r.content_md ?? "",
    notionId: r.notion_id,
    favorited: !!r.favorited,
    collectionSeq: r.collection_seq ?? null,
    wordCount: r.word_count ?? null,
    createdAt: new Date(r.created_at).getTime(),
    updatedAt: new Date(r.updated_at).getTime(),
  };
}

export function toRow(p: Post): Partial<PostRow> {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    type: p.type,
    status: p.status,
    published_at: msToIso(p.publishedAt),
    excerpt: p.excerpt,
    category: p.category,
    content_md: p.content,
    notion_id: p.notionId,
    favorited: p.favorited,
    collection_seq: p.collectionSeq ?? null,
    word_count: p.wordCount ?? null,
  };
}

// ---- local mutations ----

export async function updatePost(
  id: number,
  patch: Partial<Omit<Post, "id" | "createdAt">>,
): Promise<void> {
  const existing = await db.posts.get(id);
  if (!existing) return;
  const next: Post = {
    ...existing,
    ...patch,
    updatedAt: Date.now(),
    dirty: true,
  };
  await db.posts.put(next);
  scheduleSync();
}

export async function toggleFavorite(id: number): Promise<void> {
  const p = await db.posts.get(id);
  if (!p) return;
  await updatePost(id, { favorited: !p.favorited });
}

/**
 * Duplicate a post in the same collection. Server assigns a new integer id;
 * we compute the next collection_seq client-side.
 */
export async function duplicatePost(source: import("@/types").Post): Promise<import("@/types").Post | null> {
  const { supabase } = await import("@/lib/supabase");
  const { postSlug } = await import("@/lib/postId");

  const peers = await db.posts.where("type").equals(source.type).toArray();
  const nextSeq = peers.reduce((m, p) => Math.max(m, p.collectionSeq ?? 0), 0) + 1;

  const { data, error } = await supabase
    .from("posts")
    .insert({
      title: source.title ? `${source.title} (copy)` : "",
      slug: postSlug(source.type, nextSeq),
      type: source.type,
      status: "draft",
      content_md: source.content,
      collection_seq: nextSeq,
      category: source.category,
    })
    .select()
    .single();
  if (error) {
    console.error("duplicatePost failed:", error);
    return null;
  }
  const post = fromRow(data as PostRow);
  await db.posts.put({ ...post, syncedAt: Date.now(), dirty: false });
  return post;
}

/**
 * Hard delete. Versions cascade via the DB FK.
 */
export async function deletePost(id: number): Promise<void> {
  const { supabase } = await import("@/lib/supabase");
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) {
    console.error("deletePost failed:", error);
    return;
  }
  await db.posts.delete(id);
  await db.versions.where("postId").equals(id).delete();
}

export async function setPostStatus(id: number, status: PostStatus): Promise<void> {
  const before = await db.posts.get(id);
  const patch: Partial<Post> = { status };
  if (status === "published") {
    if (before && !before.publishedAt) patch.publishedAt = Date.now();
  }
  await updatePost(id, patch);
  if (status === "published" && before?.status !== "published") {
    const after = await db.posts.get(id);
    if (after) {
      const { snapshotVersion } = await import("@/lib/versions");
      await snapshotVersion(after, "user", "Published");
    }
  }
}
