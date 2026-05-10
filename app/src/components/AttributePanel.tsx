import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Post, PostVersion } from "@/types";
import { setPostStatus, toggleFavorite, updatePost } from "@/lib/posts";
import { collectionColor } from "@/lib/colors";
import { DiffModal } from "@/components/DiffModal";

interface Props {
  post: Post;
}

export function AttributePanel({ post }: Props) {
  const allPosts = useLiveQuery(() => db.posts.toArray(), [], [] as Post[]);
  const versions = useLiveQuery(
    () => db.versions.where("postId").equals(post.id).reverse().sortBy("version"),
    [post.id],
    [] as PostVersion[],
  );
  const collections = useMemo(() => {
    const s = new Set<string>();
    for (const p of allPosts) if (p.type) s.add(p.type);
    return [...s].sort();
  }, [allPosts]);

  const [diffFor, setDiffFor] = useState<PostVersion | null>(null);

  return (
    <aside className="flex h-full w-[280px] flex-col gap-4 overflow-y-auto border-l border-border bg-bg-elev px-4 py-6 text-sm">
      <Field label="slug">
        <input
          value={post.slug}
          onChange={(e) => void updatePost(post.id, { slug: e.target.value })}
          className="w-full bg-transparent text-fg outline-none"
        />
      </Field>
      <Field label="collection">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: collectionColor(post.type) }}
          />
          <input
            value={post.type ?? ""}
            list="collections-list"
            placeholder="hokum, journal, brief…"
            onChange={(e) => void updatePost(post.id, { type: e.target.value })}
            className="w-full bg-transparent text-fg outline-none"
          />
          <datalist id="collections-list">
            {collections.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </Field>
      <Field label="status">
        <select
          value={post.status ?? "draft"}
          onChange={(e) => void setPostStatus(post.id, e.target.value as "draft" | "published")}
          className="w-full bg-transparent text-fg outline-none"
        >
          <option value="draft">draft</option>
          <option value="published">published</option>
        </select>
      </Field>
      <Field label="published at">
        <div className="text-fg-muted">
          {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "—"}
        </div>
      </Field>
      <Field label="category">
        <input
          value={post.category ?? ""}
          onChange={(e) => void updatePost(post.id, { category: e.target.value })}
          className="w-full bg-transparent text-fg outline-none"
        />
      </Field>
      <Field label="favorite">
        <button
          onClick={() => void toggleFavorite(post.id)}
          className="text-left text-fg-muted hover:text-fg"
        >
          {post.favorited ? "★ favorited" : "☆ unfavorited"}
        </button>
      </Field>

      <div className="mt-4 border-t border-border pt-4">
        <div className="mb-2 text-[11px] uppercase tracking-wide text-fg-faint">History</div>
        {versions.length === 0 ? (
          <div className="text-xs text-fg-faint">No versions yet.</div>
        ) : (
          <ul className="space-y-1 text-xs">
            {versions.map((v) => (
              <li key={v.id}>
                <button
                  onClick={() => setDiffFor(v)}
                  className="flex w-full justify-between text-left text-fg-muted hover:text-fg"
                >
                  <span>
                    v{v.version}
                    {v.createdBy !== "user" && (
                      <span className="ml-1 text-fg-faint">· {v.createdBy}</span>
                    )}
                  </span>
                  <span className="text-fg-faint">{relative(v.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {diffFor && (
        <DiffModal post={post} initialVersion={diffFor} onClose={() => setDiffFor(null)} />
      )}
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wide text-fg-faint">{label}</span>
      {children}
    </label>
  );
}

function relative(t: number): string {
  const dt = Date.now() - t;
  const m = Math.floor(dt / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
