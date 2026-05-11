import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { postHref } from "@/lib/route";
import { renameCollection, upsertCollection } from "@/lib/collections";
import { useActiveCollection } from "@/lib/activeCollection";
import type { Collection, Post } from "@/types";

/**
 * Home view. The tab bar lives in App so it's visible everywhere; this
 * component just renders the body for the active collection.
 */
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
  const [active, setActive] = useActiveCollection();

  // Auto-create rows for any post type without a registry entry.
  const referenced = useMemo(() => {
    const s = new Set<string>();
    for (const p of posts) if (p.type) s.add(p.type);
    return s;
  }, [posts]);
  useEffect(() => {
    const have = new Set(collections.map((c) => c.name));
    for (const name of referenced) {
      if (!have.has(name)) void upsertCollection(name, {});
    }
  }, [collections, referenced]);

  // Seed the active collection on first paint.
  useEffect(() => {
    if (!collections.length) return;
    if (!active || !collections.some((c) => c.name === active)) {
      setActive(collections[0].name);
    }
  }, [collections, active, setActive]);

  if (collections.length === 0) {
    return (
      <div className="mx-auto max-w-[860px] px-12 py-24 text-center text-tertiary">
        No collections yet. Press <Kbd>⌘K</Kbd> then <Kbd>↵</Kbd> to create a post in your first collection.
      </div>
    );
  }

  const activeName =
    active && collections.some((c) => c.name === active) ? active : collections[0].name;
  const activeCollection = collections.find((c) => c.name === activeName)!;
  const collectionPosts = posts.filter((p) => p.type === activeName);

  return (
    <div className="mx-auto h-full max-w-[860px] px-10 pt-10 pb-16">
      <CollectionView collection={activeCollection} posts={collectionPosts} />
    </div>
  );
}

function CollectionView({ collection, posts }: { collection: Collection; posts: Post[] }) {
  const [emojiDraft, setEmojiDraft] = useState(collection.emoji ?? "");
  const [nameDraft, setNameDraft] = useState(collection.name);
  const [descDraft, setDescDraft] = useState(collection.description ?? "");

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
