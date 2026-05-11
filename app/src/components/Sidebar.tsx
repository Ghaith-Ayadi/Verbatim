import { useMemo, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useVirtualizer } from "@tanstack/react-virtual";
import { db } from "@/lib/db";
import { postHref } from "@/lib/route";
import { collectionDisplay } from "@/lib/collections";
import type { Post } from "@/types";

interface Props {
  currentId: number | null;
}

export function Sidebar({ currentId }: Props) {
  const posts = useLiveQuery(
    () => db.posts.orderBy("updatedAt").reverse().toArray(),
    [],
    [] as Post[],
  );

  const recent = posts.slice(0, 50);
  const favorites = useMemo(() => posts.filter((p) => p.favorited).slice(0, 50), [posts]);

  const collections = useMemo(() => {
    const m = new Map<string, Post[]>();
    for (const p of posts) {
      const key = p.type || "Uncollected";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(p);
    }
    return [...m.entries()]
      .map(([name, items]) => ({ name, items }))
      .sort((a, b) => b.items.length - a.items.length);
  }, [posts]);

  return (
    <aside className="flex h-full w-[220px] flex-col border-r border-secondary bg-secondary">
      <Header />
      <div className="flex-1 overflow-y-auto py-2">
        {favorites.length > 0 && (
          <Group label="Favorites">
            <PostList posts={favorites} currentId={currentId} />
          </Group>
        )}
        <Group label="Recent" defaultOpen>
          <VirtualPostList posts={recent} currentId={currentId} />
        </Group>
        {collections.map((c) => {
          const d = collectionDisplay(c.name);
          return (
            <Group
              key={c.name}
              label={d.label || c.name}
              emoji={d.emoji}
              count={c.items.length}
            >
              <PostList posts={c.items} currentId={currentId} />
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

function PostList({ posts, currentId }: { posts: Post[]; currentId: number | null }) {
  return (
    <ul>
      {posts.map((p) => (
        <PostRow key={p.id} post={p} active={p.id === currentId} />
      ))}
    </ul>
  );
}

function VirtualPostList({ posts, currentId }: { posts: Post[]; currentId: number | null }) {
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
              <PostRow post={p} active={p.id === currentId} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PostRow({ post, active }: { post: Post; active: boolean }) {
  const title = post.title || "Untitled";
  const d = collectionDisplay(post.type);
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
