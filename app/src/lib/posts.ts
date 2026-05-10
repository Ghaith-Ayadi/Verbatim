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
