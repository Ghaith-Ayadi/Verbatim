import { useMemo, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useVirtualizer } from "@tanstack/react-virtual";
import { db } from "@/lib/db";
import { go } from "@/lib/route";
import { collectionColor } from "@/lib/colors";
import type { Post } from "@/types";

interface Props {
  currentSlug: string | null;
}

export function Sidebar({ currentSlug }: Props) {
  const posts = useLiveQuery(
    () => db.posts.orderBy("updatedAt").reverse().toArray(),
    [],
    [] as Post[],
  );

  const recent = posts.slice(0, 50);
  const favorites = useMemo(() => posts.filter((p) => p.favorited).slice(0, 50), [posts]);

  // Group by collection (== posts.type)
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
    <aside className="flex h-full w-[220px] flex-col border-r border-border bg-bg-elev">
      <Header />
      <div className="flex-1 overflow-y-auto py-2">
        {favorites.length > 0 && (
          <Group label="Favorites">
            <PostList posts={favorites} currentSlug={currentSlug} />
          </Group>
        )}
        <Group label="Recent" defaultOpen>
          <VirtualPostList posts={recent} currentSlug={currentSlug} />
        </Group>
        {collections.map((c) => (
          <Group
            key={c.name}
            label={c.name}
            count={c.items.length}
            color={collectionColor(c.name)}
          >
            <PostList posts={c.items} currentSlug={currentSlug} />
          </Group>
        ))}
      </div>
      <Footer total={posts.length} />
    </aside>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between px-3 pt-3 pb-2">
      <a href="#/" className="font-serif text-lg italic">Verbatim</a>
      <span className="text-[11px] text-fg-faint">⌘K</span>
    </div>
  );
}

function Footer({ total }: { total: number }) {
  return (
    <div className="border-t border-border px-3 py-2 text-[11px] text-fg-faint">
      {total} {total === 1 ? "post" : "posts"}
    </div>
  );
}

function Group({
  label,
  children,
  defaultOpen = false,
  count,
  color,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
  color?: string;
}) {
  return (
    <details className="group/section" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-1 text-[11px] uppercase tracking-wide text-fg-faint hover:text-fg-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block transition group-open/section:rotate-90">›</span>
          {color && (
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            />
          )}
          {label}
        </span>
        {count != null && <span className="text-fg-faint">{count}</span>}
      </summary>
      <div className="mb-2">{children}</div>
    </details>
  );
}

function PostList({ posts, currentSlug }: { posts: Post[]; currentSlug: string | null }) {
  return (
    <ul>
      {posts.map((p) => (
        <PostRow key={p.id} post={p} active={p.slug === currentSlug} />
      ))}
    </ul>
  );
}

function VirtualPostList({ posts, currentSlug }: { posts: Post[]; currentSlug: string | null }) {
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
              <PostRow post={p} active={p.slug === currentSlug} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PostRow({ post, active }: { post: Post; active: boolean }) {
  const title = post.title || "Untitled";
  const dotColor = post.type ? collectionColor(post.type) : "transparent";
  return (
    <a
      href={`#/post/${encodeURIComponent(post.slug)}`}
      className={[
        "flex items-center gap-2 truncate px-3 py-1 text-sm",
        active ? "bg-bg-hover text-fg" : "text-fg-muted hover:bg-bg-hover hover:text-fg",
      ].join(" ")}
      title={post.type ? `${title} · ${post.type}` : title}
    >
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: dotColor }}
      />
      {post.status === "draft" && <span className="text-fg-faint">●</span>}
      <span className="truncate">{title}</span>
    </a>
  );
}
