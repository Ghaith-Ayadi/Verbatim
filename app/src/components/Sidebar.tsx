import { useMemo, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useVirtualizer } from "@tanstack/react-virtual";
import { db } from "@/lib/db";
import { postHref } from "@/lib/route";
import { collectionDisplay } from "@/lib/collections";
import type { Collection, Post } from "@/types";

interface Props {
  currentId: number | null;
}

export function Sidebar({ currentId }: Props) {
  const posts = useLiveQuery(
    () => db.posts.orderBy("updatedAt").reverse().toArray(),
    [],
    [] as Post[],
  );
  const collectionRows = useLiveQuery(
    () => db.collections.orderBy("position").toArray(),
    [],
    [] as Collection[],
  );

  const recent = posts.slice(0, 50);
  const favorites = useMemo(() => posts.filter((p) => p.favorited).slice(0, 50), [posts]);

  // Group by the collection.name registry, falling back to a synthetic group
  // for any post whose `type` doesn't have a row yet.
  const collectionGroups = useMemo(() => {
    const m = new Map<string, Post[]>();
    for (const c of collectionRows) m.set(c.name, []);
    for (const p of posts) {
      const key = p.type || "Uncollected";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(p);
    }
    const knownOrder = new Map(collectionRows.map((c, i) => [c.name, i]));
    return [...m.entries()]
      .map(([name, items]) => ({ name, items }))
      .sort((a, b) => {
        const ai = knownOrder.get(a.name) ?? Number.POSITIVE_INFINITY;
        const bi = knownOrder.get(b.name) ?? Number.POSITIVE_INFINITY;
        if (ai !== bi) return ai - bi;
        return b.items.length - a.items.length;
      });
  }, [posts, collectionRows]);

  return (
    <aside className="flex h-full w-[220px] flex-col border-r border-secondary bg-secondary">
      <Header />
      <div className="flex-1 overflow-y-auto py-2">
        {favorites.length > 0 && (
          <Group label="Favorites">
            <PostList posts={favorites} currentId={currentId} collectionRows={collectionRows} />
          </Group>
        )}
        <Group label="Recent" defaultOpen>
          <VirtualPostList posts={recent} currentId={currentId} collectionRows={collectionRows} />
        </Group>
        {collectionGroups.map((c) => {
          const d = collectionDisplay(c.name, collectionRows);
          return (
            <Group
              key={c.name}
              label={d.label || c.name}
              emoji={d.emoji}
              count={c.items.length}
            >
              <PostList posts={c.items} currentId={currentId} collectionRows={collectionRows} />
            </Group>
          );
        })}
      </div>
      <Footer total={posts.length} />
    </aside>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between px-3 pt-3 pb-2">
      <a href="#/" className="font-serif text-lg italic text-primary">Verbatim</a>
      <span className="text-[11px] text-quaternary">⌘K</span>
    </div>
  );
}

function Footer({ total }: { total: number }) {
  return (
    <div className="border-t border-secondary px-3 py-2 text-[11px] text-quaternary">
      {total} {total === 1 ? "post" : "posts"}
    </div>
  );
}

function Group({
  label,
  children,
  defaultOpen = false,
  count,
  emoji,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
  emoji?: string | null;
}) {
  return (
    <details className="group/section" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-quaternary hover:text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="inline-block transition group-open/section:rotate-90">›</span>
          {emoji && <span className="text-[13px] leading-none">{emoji}</span>}
          <span>{label}</span>
        </span>
        {count != null && <span className="text-quaternary">{count}</span>}
      </summary>
      <div className="mb-2">{children}</div>
    </details>
  );
}

function PostList({
  posts,
  currentId,
  collectionRows,
}: {
  posts: Post[];
  currentId: number | null;
  collectionRows: Collection[];
}) {
  return (
    <ul>
      {posts.map((p) => (
        <PostRow key={p.id} post={p} active={p.id === currentId} collectionRows={collectionRows} />
      ))}
    </ul>
  );
}

function VirtualPostList({
  posts,
  currentId,
  collectionRows,
}: {
  posts: Post[];
  currentId: number | null;
  collectionRows: Collection[];
}) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const virtual = useVirtualizer({
    count: posts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
    overscan: 8,
  });

  return (
    <div ref={parentRef} className="max-h-[55vh] overflow-y-auto">
      <div style={{ height: virtual.getTotalSize(), position: "relative" }}>
        {virtual.getVirtualItems().map((vi) => {
          const p = posts[vi.index];
          return (
            <div
              key={p.id}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${vi.start}px)`,
              }}
            >
              <PostRow post={p} active={p.id === currentId} collectionRows={collectionRows} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PostRow({
  post,
  active,
  collectionRows,
}: {
  post: Post;
  active: boolean;
  collectionRows: Collection[];
}) {
  const title = post.title || "Untitled";
  const d = collectionDisplay(post.type, collectionRows);
  return (
    <a
      href={postHref(post.id)}
      className={[
        "flex items-center gap-2 truncate px-3 py-1 text-sm",
        active
          ? "bg-primary_hover text-primary"
          : "text-secondary hover:bg-primary_hover hover:text-primary",
      ].join(" ")}
      title={post.type ? `${title} · ${post.type}` : title}
    >
      <span className="inline-block w-4 shrink-0 text-center text-[13px] leading-none">
        {d.emoji ?? ""}
      </span>
      {post.status === "draft" && <span className="text-quaternary">●</span>}
      <span className="truncate">{title}</span>
    </a>
  );
}
