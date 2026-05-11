// Realtime: watch posts + post_versions; updates Dexie so dexie-react-hooks reflows the UI.

import type { RealtimeChannel } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { fromRow, type PostRow } from "@/lib/posts";
import { fromVersionRow } from "@/lib/versions";
import { fromCollectionRow } from "@/lib/collections";
import { runSync } from "@/lib/sync";

let channel: RealtimeChannel | null = null;

export function startRealtime() {
  stopRealtime();

  channel = supabase
    .channel("verbatim:rt")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "posts" },
      async (payload) => {
        const now = Date.now();
        if (payload.eventType === "DELETE") {
          const old = payload.old as { id?: number };
          if (old.id != null) await db.posts.delete(old.id);
          return;
        }
        const row = payload.new as PostRow;
        if (!row?.id) return;
        const local = await db.posts.get(row.id);
        if (local?.dirty && local.updatedAt > new Date(row.updated_at).getTime()) return;
        await db.posts.put({ ...fromRow(row), syncedAt: now, dirty: false });
      },
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "post_versions" },
      async (payload) => {
        const row = payload.new as Parameters<typeof fromVersionRow>[0];
        if (!row?.id) return;
        await db.versions.put(fromVersionRow(row));
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "collections" },
      async (payload) => {
        if (payload.eventType === "DELETE") {
          const old = payload.old as { name?: string };
          if (old.name) await db.collections.delete(old.name);
          return;
        }
        const row = payload.new as Parameters<typeof fromCollectionRow>[0];
        if (!row?.name) return;
        await db.collections.put({
          ...fromCollectionRow(row),
          syncedAt: Date.now(),
          dirty: false,
        });
      },
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") void runSync();
    });
}

export function stopRealtime() {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
}
