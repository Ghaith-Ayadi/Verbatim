import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { postHref } from "@/lib/route";
import { collectionDisplay, renameCollection, upsertCollection } from "@/lib/collections";
import type { Collection, Post } from "@/types";

const LAST_TAB_KEY = "verbatim:lastTab";

export function CollectionTabs() {
  const collections = useLiveQuery(
    () => db.collections.orderBy("position").toArray(),
    [],
    [] as Collection[],
  );
  const posts = useLiveQuery(
    () => db.posts.orderBy("updatedAt").reverse().toArray(),
    [],
    [] as Post[],
  );

  // Auto-create any collection that posts reference but the table is missing.
  // Keeps the UI tolerant when posts pick up new types via MCP / DB edits.
  const referenced = useMemo(() => {
    const s = new Set<string>();
    for (const p of posts) if (p.type) s.add(p.type);
    return s;
  }, [posts]);
  useEffect(() => {
    if (collections.length === 0 && referenced.size === 0) return;
    const have = new Set(collections.map((c) => c.name));
    for (const name of referenced) {
      if (!have.has(name)) void upsertCollection(name, {});
    }
  }, [collections, referenced]);

  const [active, setActive] = useState<string | null>(() => {
    return typeof localStorage !== "undefined" ? localStorage.getItem(LAST_TAB_KEY) : null;
  });

  // Fall back to the first collection if the remembered one no longer exists.
  const activeName: string | null = useMemo(() => {
    if (!collections.length) return null;
    if (active && collections.some((c) => c.name === active)) return active;
    return collections[0].name;
  }, [active, collections]);

  useEffect(() => {
    if (activeName) localStorage.setItem(LAST_TAB_KEY, activeName);
  }, [activeName]);

  const activeCollection = collections.find((c) => c.name === activeName) ?? null;
  const collectionPosts = useMemo(
    () => (activeName ? posts.filter((p) => p.type === activeName) : []),
    [posts, activeName],
  );

  if (collections.length === 0) {
    return (
      <div className="mx-auto max-w-[860px] px-12 py-24 text-center text-tertiary">
        No collections yet. Press <Kbd>⌘K</Kbd> then <Kbd>↵</Kbd> to create a post in your first collection.
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-[860px] flex-col px-10 pt-8 pb-16">
      <TabBar
        collections={collections}
        active={activeName}
        onSelect={(name) => setActive(name)}
      />
      <div className="mt-10 flex-1">
        {activeCollection && (
          <CollectionView collection={activeCollection} posts={collectionPosts} />
        )}
      </div>
    </div>
  );
}

function TabBar({
  collections,
  active,
  onSelect,
}: {
  collections: Collection[];
  active: string | null;
  onSelect: (name: string) => void;
}) {
  return (
    <nav
      role="tablist"
      className="-mx-2 flex items-center gap-1 overflow-x-auto border-b border-secondary"
    >
      {collections.map((c) => {
        const d = collectionDisplay(c.name, collections);
        const isActive = c.name === active;
        return (
          <button
            key={c.name}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(c.name)}
            className={[
              "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition",
              isActive
                ? "border-fg-brand-primary text-primary"
                : "border-transparent text-tertiary hover:text-secondary",
            ].join(" ")}
          >
            {d.emoji && <span className="text-base leading-none">{d.emoji}</span>}
            <span className="font-medium">{d.label || c.name}</span>
          </button>
        );
      })}
    </nav>
  );
}

function CollectionView({ collection, posts }: { collection: Collection; posts: Post[] }) {
  // Local form state so typing doesn't fire a save on every keystroke.
  // Commits on blur or Enter (for inputs).
  const [emojiDraft, setEmojiDraft] = useState(collection.emoji ?? "");
  const [nameDraft, setNameDraft] = useState(collection.name);
  const [descDraft, setDescDraft] = useState(collection.description ?? "");

  // Sync drafts when switching tabs.
  useEffect(() => {
    setEmojiDraft(collection.emoji ?? "");
    setNameDraft(collection.name);
    setDescDraft(collection.description ?? "");
  }, [collection.name, collection.emoji, collection.description]);

  const saveEmoji = () => {
    const next = emojiDraft.trim() || null;
    if (next !== (collection.emoji ?? null)) {
      void upsertCollection(collection.name, { emoji: next });
    }
  };
  const saveName = () => {
    const next = nameDraft.trim();
    if (next && next !== collection.name) void renameCollection(collection.name, next);
    else setNameDraft(collection.name);
  };
  const saveDesc = () => {
    const next = descDraft.trim() || null;
    if (next !== (collection.description ?? null)) {
      void upsertCollection(collection.name, { description: next });
    }
  };

  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          aria-label="Collection emoji"
          value={emojiDraft}
          onChange={(e) => setEmojiDraft(e.target.value)}
          onBlur={saveEmoji}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          placeholder="🙂"
          className="w-14 shrink-0 rounded-lg bg-transparent text-center font-serif text-4xl text-primary outline-none placeholder:text-quaternary focus:bg-primary_hover"
        />
        <input
          aria-label="Collection name"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={saveName}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          placeholder="Untitled collection"
          className="flex-1 bg-transparent font-serif text-4xl text-primary outline-none placeholder:text-quaternary"
        />
      </div>

      <textarea
        aria-label="Collection description"
        value={descDraft}
        onChange={(e) => setDescDraft(e.target.value)}
        onBlur={saveDesc}
        placeholder="What is this collection about?"
        rows={2}
        className="mt-3 w-full resize-none bg-transparent text-base text-secondary outline-none placeholder:text-quaternary"
      />

      <ul className="mt-8 divide-y divide-secondary">
        {posts.length === 0 && (
          <li className="py-8 text-center text-sm text-tertiary">
            No posts in this collection yet.
          </li>
        )}
        {posts.map((p) => (
          <li key={p.id}>
            <a
              href={postHref(p.id)}
              className="flex items-baseline justify-between gap-6 py-3 hover:opacity-90"
            >
              <span className="flex items-baseline gap-2">
                {p.status === "draft" && (
                  <span className="text-[11px] uppercase tracking-wide text-quaternary">draft</span>
                )}
                <span className="text-lg text-primary">{p.title || "Untitled"}</span>
              </span>
              <span className="text-xs text-quaternary">
                {new Date(p.updatedAt).toLocaleDateString()}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="mx-1 inline-flex h-5 min-w-5 items-center justify-center rounded border border-secondary bg-secondary px-1 text-[11px] text-secondary">
      {children}
    </kbd>
  );
}
