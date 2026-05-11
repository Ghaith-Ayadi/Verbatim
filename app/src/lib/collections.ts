// Collections: first-class records with name (PK), emoji, description, position.
// Display rule: prefer the stored emoji; fall back to a leading emoji grapheme
// inside the name itself so legacy data (no row in `collections`) still renders.

import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import type { Collection } from "@/types";

interface CollectionRow {
  name: string;
  emoji: string | null;
  description: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export function fromCollectionRow(r: CollectionRow): Collection {
  return {
    name: r.name,
    emoji: r.emoji,
    description: r.description,
    position: r.position,
    createdAt: new Date(r.created_at).getTime(),
    updatedAt: new Date(r.updated_at).getTime(),
  };
}

// --- emoji extraction (legacy fallback) ---
const segmenter =
  typeof Intl !== "undefined" && (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;
const PICTO = /\p{Extended_Pictographic}/u;

export interface CollectionDisplay {
  emoji: string | null;
  label: string;
}

function leadingEmoji(name: string): { emoji: string | null; rest: string } {
  if (!name) return { emoji: null, rest: "" };
  let first: string;
  if (segmenter) {
    const it = segmenter.segment(name)[Symbol.iterator]();
    const step = it.next() as IteratorResult<{ segment: string }>;
    first = step.done ? "" : step.value.segment;
  } else {
    first = name[0] ?? "";
  }
  if (first && PICTO.test(first)) return { emoji: first, rest: name.slice(first.length).trim() };
  return { emoji: null, rest: name };
}

/**
 * Visual representation for a given collection name.
 * If a row exists in `collections`, use its stored emoji + name verbatim.
 * Otherwise fall back to "leading emoji in name" so legacy posts still render.
 */
export function collectionDisplay(
  name: string | null | undefined,
  byName?: Map<string, Collection> | Collection[],
): CollectionDisplay {
  if (!name) return { emoji: null, label: "" };
  const map =
    byName instanceof Map
      ? byName
      : new Map((byName ?? []).map((c) => [c.name, c]));
  const stored = map.get(name);
  if (stored) {
    return { emoji: stored.emoji ?? null, label: stored.name };
  }
  const led = leadingEmoji(name);
  return { emoji: led.emoji, label: led.rest || name };
}

// --- mutations ---

export async function upsertCollection(
  name: string,
  patch: Partial<Pick<Collection, "emoji" | "description" | "position">>,
): Promise<void> {
  const existing = await db.collections.get(name);
  const now = Date.now();
  const next: Collection = {
    name,
    emoji: patch.emoji !== undefined ? patch.emoji : existing?.emoji ?? null,
    description:
      patch.description !== undefined ? patch.description : existing?.description ?? null,
    position: patch.position !== undefined ? patch.position : existing?.position ?? 0,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    dirty: false,
  };
  await db.collections.put(next);

  const { error } = await supabase
    .from("collections")
    .upsert({
      name,
      emoji: next.emoji,
      description: next.description,
      position: next.position,
    });
  if (error) {
    console.error("upsertCollection failed:", error);
    // Mark dirty so the next sync retries.
    await db.collections.put({ ...next, dirty: true });
  }
}

/**
 * Rename a collection. Bulk-updates `posts.type` from the old name to the new
 * one in a single SQL UPDATE, then upserts the new row and deletes the old.
 */
export async function renameCollection(oldName: string, newName: string): Promise<void> {
  if (oldName === newName || !newName) return;
  const existing = await db.collections.get(oldName);
  if (existing) {
    await upsertCollection(newName, {
      emoji: existing.emoji,
      description: existing.description,
      position: existing.position,
    });
  } else {
    await upsertCollection(newName, {});
  }
  // Update posts in Supabase first (single SQL update), then mirror locally.
  const { error } = await supabase
    .from("posts")
    .update({ type: newName })
    .eq("type", oldName);
  if (error) {
    console.error("renameCollection update posts failed:", error);
    return;
  }
  // Mirror in Dexie so the UI updates without waiting for the next pull.
  const affected = await db.posts.where("type").equals(oldName).toArray();
  await db.transaction("rw", db.posts, async () => {
    for (const p of affected) {
      await db.posts.put({ ...p, type: newName });
    }
  });
  // Delete the old collection row.
  await db.collections.delete(oldName);
  const { error: delErr } = await supabase.from("collections").delete().eq("name", oldName);
  if (delErr) console.error("renameCollection delete old failed:", delErr);
}

export async function createCollection(
  name: string,
  patch: Partial<Pick<Collection, "emoji" | "description">> = {},
): Promise<void> {
  // position = max + 1
  const all = await db.collections.toArray();
  const position = all.length === 0 ? 0 : Math.max(...all.map((c) => c.position)) + 1;
  await upsertCollection(name, { ...patch, position });
}
