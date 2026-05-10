import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Command } from "cmdk";
import { useHotkeys } from "react-hotkeys-hook";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { search, subscribeSearch } from "@/lib/search";
import { go } from "@/lib/route";
import { useLayout } from "@/lib/layout";
import { collectionColor } from "@/lib/colors";
import { fromRow, setPostStatus, type PostRow } from "@/lib/posts";
import type { Post } from "@/types";

type Mode = "search" | "commands";

export function CommandPalette({ currentPostId }: { currentPostId: number | null }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const mode: Mode = q.startsWith(">") ? "commands" : "search";
  const [, , toggleAuthorMode] = useLayout();

  const allPosts = useLiveQuery(() => db.posts.toArray(), [], [] as Post[]);
  const knownCollections = useMemo(() => {
    const s = new Set<string>();
    for (const p of allPosts) if (p.type) s.add(p.type);
    return [...s].sort();
  }, [allPosts]);

  useSyncExternalStore(
    (cb) => subscribeSearch(cb),
    () => "v",
  );

  useHotkeys("mod+k", (e) => {
    e.preventDefault();
    setOpen((o) => !o);
  });
  useHotkeys("escape", () => setOpen(false), { enabled: open });

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const results = useMemo(() => {
    if (mode === "search") return search(q, 12);
    return [];
  }, [q, mode]);

  if (!open) return null;

  async function newPost(type = "hokum") {
    const slug = `untitled-${Date.now().toString(36)}`;
    const { data, error } = await supabase
      .from("posts")
      .insert({
        title: "",
        slug,
        type,
        status: "draft",
        content_md: "",
      })
      .select()
      .single();
    if (error) {
      console.error("New post failed:", error);
      window.alert(`New post failed: ${error.message}`);
      return;
    }
    const post = fromRow(data as PostRow);
    await db.posts.put({ ...post, syncedAt: Date.now(), dirty: false });
    setOpen(false);
    go({ view: "post", slug: post.slug });
  }

  async function publishCurrent() {
    if (currentPostId == null) return;
    await setPostStatus(currentPostId, "published");
    setOpen(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-[12vh] w-[640px] overflow-hidden rounded-xl border border-border bg-bg-elev shadow-2xl"
      >
        <Command shouldFilter={false} className="w-full">
          <Command.Input
            autoFocus
            placeholder={mode === "commands" ? "Type a command…" : "Search posts… ( > for commands )"}
            value={q}
            onValueChange={setQ}
            className="w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-fg-faint"
          />
          <Command.List className="max-h-[60vh] overflow-y-auto p-1">
            <Command.Empty className="px-3 py-6 text-center text-sm text-fg-faint">
              {mode === "search" ? "No results." : "No commands."}
            </Command.Empty>

            {mode === "commands" && (
              <Command.Group>
                {knownCollections.map((c) => (
                  <Item
                    key={c}
                    label={`New post in ${c}`}
                    color={collectionColor(c)}
                    onSelect={() => void newPost(c)}
                  />
                ))}
                <Item
                  label="New post in new collection…"
                  onSelect={() => {
                    const name = window.prompt("New collection name");
                    if (name) void newPost(name.trim());
                  }}
                />
                <Item
                  label="Toggle author mode"
                  hint="⌘\\"
                  onSelect={() => {
                    toggleAuthorMode();
                    setOpen(false);
                  }}
                />
                {currentPostId != null && (
                  <Item label="Publish current post" onSelect={() => void publishCurrent()} />
                )}
              </Command.Group>
            )}

            {mode === "search" && q && (
              <Command.Group heading="Posts">
                {results.map((r) => {
                  const slug = (r as unknown as { slug?: string }).slug ?? "";
                  const status = (r as unknown as { status?: string | null }).status;
                  return (
                    <Item
                      key={r.id}
                      label={String((r as unknown as { title?: string }).title || "Untitled")}
                      hint={status === "draft" ? "draft" : undefined}
                      onSelect={() => {
                        if (slug) go({ view: "post", slug });
                        setOpen(false);
                      }}
                    />
                  );
                })}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

function Item({
  label,
  hint,
  onSelect,
  color,
}: {
  label: string;
  hint?: string;
  onSelect: () => void;
  color?: string;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-fg-muted aria-selected:bg-bg-hover aria-selected:text-fg"
    >
      <span className="flex items-center gap-2">
        {color && (
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
        {label}
      </span>
      {hint && <span className="text-xs text-fg-faint">{hint}</span>}
    </Command.Item>
  );
}
