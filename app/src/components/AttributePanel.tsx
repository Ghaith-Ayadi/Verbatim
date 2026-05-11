import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Star01 } from "@untitledui/icons";
import { db } from "@/lib/db";
import type { Post, PostVersion } from "@/types";
import { setPostStatus, toggleFavorite, updatePost } from "@/lib/posts";
import { collectionDisplay } from "@/lib/collections";
import { DiffModal } from "@/components/DiffModal";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { Button } from "@/components/base/buttons/button";

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

  const collectionItems = useMemo(
    () =>
      collections.map((c) => {
        const d = collectionDisplay(c);
        return {
          id: c,
          label: d.emoji ? `${d.emoji}  ${d.label || c}` : c,
        };
      }),
    [collections],
  );
  const statusItems = [
    { id: "draft", label: "Draft" },
    { id: "published", label: "Published" },
  ];

  return (
    <aside className="flex h-full w-[300px] flex-col gap-5 overflow-y-auto border-l border-secondary bg-secondary px-5 py-6 text-sm">
      <FieldStack label="Slug">
        <Input
          size="sm"
          value={post.slug}
          onChange={(v) => void updatePost(post.id, { slug: v })}
        />
      </FieldStack>

      <FieldStack label="Collection">
        <Select
          size="sm"
          selectedKey={post.type ?? null}
          onSelectionChange={(k) => void updatePost(post.id, { type: String(k ?? "") })}
          items={collectionItems}
          placeholder="—"
        >
          {(item) => <Select.Item id={item.id} label={item.label} />}
        </Select>
        <p className="mt-1.5 text-[11px] text-quaternary">
          Prefix the name with an emoji to give the collection an icon.
        </p>
      </FieldStack>

      <FieldStack label="Status">
        <Select
          size="sm"
          selectedKey={post.status ?? "draft"}
          onSelectionChange={(k) => void setPostStatus(post.id, k as "draft" | "published")}
          items={statusItems}
        >
          {(item) => <Select.Item id={item.id} label={item.label} />}
        </Select>
      </FieldStack>

      <FieldStack label="Published">
        <div className="text-secondary">
          {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "—"}
        </div>
      </FieldStack>

      <FieldStack label="Category">
        <Input
          size="sm"
          value={post.category ?? ""}
          onChange={(v) => void updatePost(post.id, { category: v })}
        />
      </FieldStack>

      <div>
        <Button
          size="sm"
          color={post.favorited ? "primary" : "tertiary"}
          iconLeading={Star01}
          onClick={() => void toggleFavorite(post.id)}
        >
          {post.favorited ? "Favorited" : "Favorite"}
        </Button>
      </div>

      <div className="mt-2 border-t border-secondary pt-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-quaternary">
          History
        </div>
        {versions.length === 0 ? (
          <div className="text-xs text-tertiary">No versions yet.</div>
        ) : (
          <ul className="space-y-1 text-xs">
            {versions.map((v) => (
              <li key={v.id}>
                <button
                  onClick={() => setDiffFor(v)}
                  className="flex w-full justify-between text-left text-secondary transition hover:text-primary"
                >
                  <span>
                    v{v.version}
                    {v.createdBy !== "user" && (
                      <span className="ml-1 text-quaternary">· {v.createdBy}</span>
                    )}
                  </span>
                  <span className="text-quaternary">{relative(v.createdAt)}</span>
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

function FieldStack({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-quaternary">
        {label}
      </div>
      {children}
    </div>
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
