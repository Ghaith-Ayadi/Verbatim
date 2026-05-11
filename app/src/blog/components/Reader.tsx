import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fetchPostBySlug, useBlogData, type BlogPost } from "@/blog/data";
import { useBlogRoute } from "@/blog/route";
import { Colophon } from "./Colophon";
import { readTime } from "@/lib/format";

interface Props {
  slug: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDate(ms: number | null | undefined): string {
  if (ms == null) return "—";
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Wrap the last word of the title in <em> for the design's tonal lift. */
function titleWithLastEm(title: string): React.ReactNode {
  if (!title) return "Untitled";
  const words = title.split(/\s+/);
  if (words.length === 1) return <em>{title}</em>;
  const last = words.pop()!;
  return (
    <>
      {words.join(" ") + " "}
      <em>{last}</em>
    </>
  );
}

export function Reader({ slug }: Props) {
  const [, navigate] = useBlogRoute();
  const { collections, posts } = useBlogData();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const p = await fetchPostBySlug(slug);
      if (cancelled) return;
      setPost(p);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Same-collection prev/next, sorted by published_at desc.
  const peers = useMemo(() => {
    if (!post) return [] as BlogPost[];
    return posts
      .filter((p) => p.type === post.type)
      .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
  }, [post, posts]);
  const idx = post ? peers.findIndex((p) => p.id === post.id) : -1;
  const prev = idx >= 0 && idx < peers.length - 1 ? peers[idx + 1] : null; // older
  const next = idx > 0 ? peers[idx - 1] : null; // newer

  const collection = post ? collections.find((c) => c.name === post.type) : null;
  const colDisplay = collection ? collection.name : post?.type ?? "";
  const colEmoji = collection?.emoji ?? "";

  if (loading) {
    return (
      <div className="blog-app">
        <div className="blog-reader-bar">
          <button className="back" onClick={() => navigate({ view: "home" })}>
            ← Index
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="blog-app">
        <div className="blog-reader-bar">
          <button className="back" onClick={() => navigate({ view: "home" })}>
            ← Index
          </button>
        </div>
        <article className="blog-article">
          <h1>Not found.</h1>
          <p className="dek">That post isn't published, or the URL is off.</p>
        </article>
        <Colophon />
      </div>
    );
  }

  const rtMin = readTime(post.wordCount);

  return (
    <div className="blog-app">
      <div className="blog-reader-bar">
        <button className="back" onClick={() => navigate({ view: "home" })}>
          ← Index
        </button>
        <div className="crumb">
          <span className="col-name">
            {colEmoji ? `${colEmoji} ${colDisplay}` : colDisplay}
          </span>
        </div>
        <div className="reader-meta">
          <span>{rtMin > 0 ? `${rtMin} min read` : "—"}</span>
          <span>{fmtDate(post.publishedAt)}</span>
        </div>
      </div>

      <article className="blog-article">
        <div className="a-eyebrow">
          <span>{colDisplay}</span>
          {post.slug && <span style={{ color: "var(--mute-2)" }}>·</span>}
          {post.slug && <b>{post.slug}</b>}
        </div>

        <h1>{titleWithLastEm(post.title)}</h1>

        {post.excerpt && <p className="dek">{post.excerpt}</p>}

        <div className="blog-byline">
          <div className="avatar">A</div>
          <div>
            <span className="by-name">Ayadi Ghaith</span>
            <span className="by-sep">·</span>
            <span>{fmtDate(post.publishedAt)}</span>
          </div>
          <div className="by-right">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}%20${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noreferrer"
            >
              Share
            </a>
          </div>
        </div>

        <div className="blog-prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>
      </article>

      <div className="blog-a-foot">
        <div className="row">
          <span className="label">Filed under</span>
          <span className="value">{colDisplay}</span>
        </div>
        {post.wordCount != null && (
          <div className="row">
            <span className="label">Words</span>
            <span className="value">{post.wordCount.toLocaleString()}</span>
          </div>
        )}
        <div className="row">
          <span className="label">Permalink</span>
          <span className="value">/p/{post.slug}</span>
        </div>
      </div>

      <div className="blog-nextprev">
        {prev ? (
          <button
            type="button"
            className="blog-np prev"
            onClick={() => navigate({ view: "post", slug: prev.slug })}
          >
            <div className="npl">← Previous</div>
            <div className="npt">{prev.title || "Untitled"}</div>
          </button>
        ) : (
          <span />
        )}
        {next ? (
          <button
            type="button"
            className="blog-np next"
            onClick={() => navigate({ view: "post", slug: next.slug })}
          >
            <div className="npl">Next →</div>
            <div className="npt">{next.title || "Untitled"}</div>
          </button>
        ) : (
          <span />
        )}
      </div>

      <Colophon />
    </div>
  );
}
