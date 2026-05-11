import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Command } from "cmdk";
import { useHotkeys } from "react-hotkeys-hook";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowDown, ArrowUp, CornerDownLeft, FilePlus02, SearchLg } from "@untitledui/icons";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { search, subscribeSearch } from "@/lib/search";
import { go } from "@/lib/route";
import { useLayout } from "@/lib/layout";
import { collectionColor } from "@/lib/colors";
import { fromRow, setPostStatus, type PostRow } from "@/lib/posts";
import type { Post } from "@/types";

type Mode = "search" | "commands";

interface Props {
  currentPostId: number | null;
}

export function CommandPalette({ currentPostId }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const mode: Mode = q.startsWith("/") ? "commands" : "search";
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
  useHotkeys(
    "mod+shift+n",
    (e) => {
      e.preventDefault();
      void newPost(knownCollections[0] ?? "hokum");
    },
    [knownCollections.join("|")],
  );
  useHotkeys("escape", () => setOpen(false), { enabled: open });

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const results = useMemo(() => {
    if (mode === "search") return search(q, 12);
    return [];
  }, [q, mode]);

  async function newPost(type: string) {
    const slug = `untitled-${Date.now().toString(36)}`;
    const { data, error } = await supabase
      .from("posts")
      .insert({ title: "", slug, type, status: "draft", content_md: "" })
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-overlay/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-[12vh] flex w-[680px] max-w-[92vw] flex-col overflow-hidden rounded-2xl border border-secondary bg-secondary shadow-2xl ring-1 ring-primary"
      >
        <Command shouldFilter={false} className="flex w-full flex-col">
          <div className="flex items-center gap-2 border-b border-secondary px-4">
            <SearchLg data-icon className="size-4 shrink-0 text-quaternary" />
            <Command.Input
              autoFocus
              placeholder={
                mode === "commands"
                  ? "Type a command…"
                  : "Search posts… (type / for commands)"
              }
              value={q}
              onValueChange={setQ}
              className="w-full bg-transparent px-1 py-3.5 text-sm text-primary outline-none placeholder:text-quaternary"
            />
          </div>

          <Command.List className="max-h-[60vh] min-h-[120px] overflow-y-auto p-1.5">
            <Command.Empty className="px-3 py-8 text-center text-sm text-tertiary">
              {mode === "search" ? "No results." : "No commands."}
            </Command.Empty>

            {mode === "commands" && (
              <Command.Group>
                {knownCollections.map((c) => (
                  <Item
                    key={c}
                    icon={<FilePlus02 className="size-4" />}
                    label={`New post in ${c}`}
                    color={collectionColor(c)}
                    onSelect={() => void newPost(c)}
                  />
                ))}
                <Item
                  icon={<FilePlus02 className="size-4" />}
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
                  const type = (r as unknown as { type?: string }).type;
                  return (
                    <Item
                      key={r.id}
                      label={String((r as unknown as { title?: string }).title || "Untitled")}
                      color={type ? collectionColor(type) : undefined}
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

          <Footer />
        </Command>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-secondary bg-primary px-4 py-2.5 text-xs text-tertiary">
      <div className="flex items-center gap-3">
        <Kbd>
          <ArrowUp className="size-3" />
          <ArrowDown className="size-3" />
        </Kbd>
        <span>navigate</span>
        <Kbd>
          <CornerDownLeft className="size-3" />
        </Kbd>
        <span>select</span>
        <Kbd>esc</Kbd>
        <span>close</span>
      </div>
      <div className="flex items-center gap-2">
        <Kbd>/</Kbd>
        <span>commands</span>
        <span className="text-quaternary">·</span>
        <Kbd>⌘⇧N</Kbd>
        <span>new post</span>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center gap-0.5 rounded border border-secondary bg-secondary_alt px-1 font-sans text-[11px] font-medium text-secondary">
      {children}
    </kbd>
  );
}

function Item({
  label,
  hint,
  onSelect,
  color,
  icon,
}: {
  label: string;
  hint?: string;
  onSelect: () => void;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-secondary transition aria-selected:bg-primary_hover aria-selected:text-primary"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        {color && (
          <span
            aria-hidden
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
        {!color && icon && <span className="shrink-0 text-quaternary">{icon}</span>}
        <span className="truncate">{label}</span>
      </span>
      {hint && <span className="shrink-0 text-xs text-quaternary">{hint}</span>}
    </Command.Item>
  );
}
