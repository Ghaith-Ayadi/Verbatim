import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Post } from "@/types";

export function PostListView() {
  const posts = useLiveQuery(
    () => db.posts.orderBy("updatedAt").reverse().toArray(),
    [],
    [] as Post[],
  );

  return (
    <div className="mx-auto max-w-[820px] px-12 py-12">
      <h1 className="mb-8 font-serif text-3xl italic">All posts</h1>
      <ul className="divide-y divide-border">
        {posts.map((p) => (
          <li key={p.id}>
            <a
              href={`#/post/${encodeURIComponent(p.slug)}`}
              className="flex items-baseline justify-between gap-6 py-3 hover:opacity-90"
            >
              <span className="flex items-baseline gap-2">
                {p.status === "draft" && <span className="text-xs text-fg-faint">draft</span>}
                <span className="text-lg">{p.title || "Untitled"}</span>
              </span>
              <span className="text-xs text-fg-faint">
                {new Date(p.updatedAt).toLocaleDateString()}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
