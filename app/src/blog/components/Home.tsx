import { useEffect, useMemo, useState } from "react";
import type { Collection } from "@/types";
import type { BlogPost } from "@/blog/data";
import { navigateTo, postHref } from "@/blog/route";
import { useActiveTab } from "@/blog/activeTab";
import { readTime } from "@/lib/format";
import { Topbar } from "./Topbar";
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
  const [storedTab, setStoredTab] = useActiveTab();
  const [sort, setSort] = useState<SortMode>("latest");

  // Resolve the active collection: stored value if valid, else the first one
  // that actually has posts, else the first collection.
  const fallbackName = useMemo(() => {
    const withPosts = collections.find((c) => posts.some((p) => p.type === c.name));
    return withPosts?.name ?? collections[0]?.name ?? "";
  }, [collections, posts]);

  const activeName =
    storedTab && collections.some((c) => c.name === storedTab) ? storedTab : fallbackName;

  // Keep document.title pinned to the brand on home (tabs don't change URL,
  // so they shouldn't change the page title either).
  useEffect(() => {
    document.title = "Verbatim";
  }, []);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of posts) m[p.type] = (m[p.type] ?? 0) + 1;
    return m;
  }, [posts]);

  const visible = useMemo(() => {
    const xs = posts.filter((p) => p.type === activeName);
    if (sort === "az") return [...xs].sort((a, b) => a.title.localeCompare(b.title));
    return [...xs].sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
  }, [posts, activeName, sort]);

  const activeCollection = collections.find((c) => c.name === activeName);
  const lastUpdate = posts.reduce<number | null>(
    (m, p) => (p.publishedAt && (m == null || p.publishedAt > m) ? p.publishedAt : m),
    null,
  );

  return (
    <div className="blog-app">
      <Topbar />
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
                type="button"
                role="tab"
                aria-selected={c.name === activeName}
                className="blog-tab"
                onClick={() => setStoredTab(c.name)}
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
            {visible.map((p) => {
              const rt = readTime(p.wordCount);
              return (
                <a
                  key={p.id}
                  href={postHref(p.slug)}
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                    e.preventDefault();
                    navigateTo({ view: "post", slug: p.slug });
                  }}
                  className="blog-post-row"
                >
                  <div className="pr-title">{p.title || "Untitled"}</div>
                  <div className="pr-meta-row">
                    {p.excerpt && <span className="pr-dek">{p.excerpt}</span>}
                    {p.excerpt && <span className="sep" aria-hidden>·</span>}
                    <span>{fmtDate(p.publishedAt)}</span>
                    {rt > 0 && (
                      <>
                        <span className="sep" aria-hidden>·</span>
                        <span>{rt} min read</span>
                      </>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      <Colophon />
    </div>
  );
}
