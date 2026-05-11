import { useMemo, useState } from "react";
import type { Collection } from "@/types";
import type { BlogPost } from "@/blog/data";
import { useBlogRoute } from "@/blog/route";
import { Masthead } from "./Masthead";
import { Hero } from "./Hero";
import { Colophon } from "./Colophon";

type SortMode = "latest" | "az";

interface Props {
  collections: Collection[];
  posts: BlogPost[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDate(ms: number | null): string {
  if (ms == null) return "—";
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function Home({ collections, posts }: Props) {
  const [, navigate] = useBlogRoute();
  const [sort, setSort] = useState<SortMode>("latest");
  const [activeName, setActiveName] = useState<string>(() => {
    // First collection that actually has posts, otherwise first collection.
    const withPosts = collections.find((c) => posts.some((p) => p.type === c.name));
    return withPosts?.name ?? collections[0]?.name ?? "";
  });

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of posts) m[p.type] = (m[p.type] ?? 0) + 1;
    return m;
  }, [posts]);

  const visible = useMemo(() => {
    const xs = posts.filter((p) => p.type === activeName);
    if (sort === "az") {
      return [...xs].sort((a, b) => a.title.localeCompare(b.title));
    }
    return [...xs].sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
  }, [posts, activeName, sort]);

  const activeCollection = collections.find((c) => c.name === activeName);
  const lastUpdate = posts.reduce<number | null>(
    (m, p) => (p.publishedAt && (m == null || p.publishedAt > m) ? p.publishedAt : m),
    null,
  );

  return (
    <div className="blog-app">
      <Masthead />
      <Hero
        postCount={posts.length}
        collectionCount={collections.length}
        lastUpdate={lastUpdate}
      />

      <div className="blog-tabs-wrap">
        <div className="blog-tabs" role="tablist">
          {collections.map((c) => {
            const display = c.emoji ? `${c.emoji} ${c.name}` : c.name;
            return (
              <button
                key={c.name}
                role="tab"
                aria-selected={c.name === activeName}
                className="blog-tab"
                onClick={() => setActiveName(c.name)}
              >
                {display} <span className="count">{counts[c.name] ?? 0}</span>
              </button>
            );
          })}
          <span className="spacer" />
          <div className="feed-mode" role="group" aria-label="Sort">
            <button aria-pressed={sort === "latest"} onClick={() => setSort("latest")}>
              Latest
            </button>
            <button aria-pressed={sort === "az"} onClick={() => setSort("az")}>
              A–Z
            </button>
          </div>
        </div>
      </div>

      {activeCollection && (
        <section>
          <header className="blog-col-head">
            <div>
              <h2>
                {activeCollection.emoji ? `${activeCollection.emoji} ` : ""}
                {activeCollection.name}
              </h2>
              {activeCollection.description && (
                <p className="col-desc">{activeCollection.description}</p>
              )}
            </div>
            <div className="col-stat">
              <div>
                <b>{counts[activeCollection.name] ?? 0}</b> entries
              </div>
            </div>
          </header>
          <div className="blog-feed">
            {visible.length === 0 && (
              <p style={{ padding: "60px 0", color: "var(--mute)" }}>
                Nothing published in this collection yet.
              </p>
            )}
            {visible.map((p, i) => (
              <a
                key={p.id}
                href={`/p/${encodeURIComponent(p.slug)}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate({ view: "post", slug: p.slug });
                }}
                className={`blog-post-row${i === 0 ? " featured" : ""}`}
              >
                <div className="pr-title">
                  {p.title || "Untitled"}
                  {p.excerpt && <span className="pr-dek">{p.excerpt}</span>}
                </div>
                <div className="pr-date">{fmtDate(p.publishedAt)}</div>
              </a>
            ))}
          </div>
        </section>
      )}

      <Colophon />
    </div>
  );
}
