// Dashboard-02-style table for the posts in the active collection.
// - First body row is "+ New post" — replaces the floating add-post button
// - Status filter chips (All / Drafts / Published) above the table
// - Title filter input on the right

import { useMemo, useState } from "react";
import { Plus, SearchLg } from "@untitledui/icons";
import type { Post } from "@/types";
import { go } from "@/lib/route";
import { formatDate } from "@/lib/format";

type StatusFilter = "all" | "draft" | "published";

interface Props {
  posts: Post[];
  onAddPost: () => void;
}

export function PostTable({ posts, onAddPost }: Props) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let xs = posts;
    if (filter !== "all") {
      xs = xs.filter((p) => (p.status ?? "draft") === filter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      xs = xs.filter(
        (p) => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
      );
    }
    return xs;
  }, [posts, filter, query]);

  const counts = useMemo(() => {
    let draft = 0;
    let published = 0;
    for (const p of posts) {
      if ((p.status ?? "draft") === "published") published++;
      else draft++;
    }
    return { all: posts.length, draft, published };
  }, [posts]);

  return (
    <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
      <Toolbar
        filter={filter}
        onFilterChange={setFilter}
        query={query}
        onQueryChange={setQuery}
        counts={counts}
      />
      <table className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr>
            <Th className="w-20">ID</Th>
            <Th>Title</Th>
            <Th className="w-28">Status</Th>
            <Th className="w-36 text-right">Updated</Th>
          </tr>
        </thead>
        <tbody>
          <tr
            tabIndex={0}
            onClick={onAddPost}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onAddPost();
              }
            }}
            className="cursor-pointer border-b border-secondary text-tertiary outline-none transition hover:bg-secondary hover:text-primary focus:bg-secondary"
          >
            <Td>
              <Plus className="size-4" />
            </Td>
            <Td className="text-sm">New post</Td>
            <Td />
            <Td />
          </tr>
          {filtered.map((p) => (
            <tr
              key={p.id}
              tabIndex={0}
              onClick={() => go({ view: "post", id: p.id })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  go({ view: "post", id: p.id });
                }
              }}
              className="group cursor-pointer border-b border-secondary text-secondary outline-none transition last:border-b-0 hover:bg-secondary focus:bg-secondary"
            >
              <Td className="date-pill text-xs text-quaternary">{p.slug || "—"}</Td>
              <Td className="truncate text-sm text-primary">
                {p.title || <span className="text-quaternary">Untitled</span>}
              </Td>
              <Td>
                <StatusBadge status={(p.status ?? "draft") as "draft" | "published"} />
              </Td>
              <Td className="date-pill text-right text-xs text-quaternary">
                {formatDate(p.updatedAt)}
              </Td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td
                colSpan={4}
                className="border-b border-secondary px-4 py-8 text-center text-sm text-tertiary last:border-b-0"
              >
                {query ? "No matches." : "No posts in this filter."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={[
        "border-b border-secondary bg-secondary px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-quaternary",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <td className={["px-4 py-2.5 align-middle", className ?? ""].join(" ")}>{children}</td>
  );
}

function Toolbar({
  filter,
  onFilterChange,
  query,
  onQueryChange,
  counts,
}: {
  filter: StatusFilter;
  onFilterChange: (s: StatusFilter) => void;
  query: string;
  onQueryChange: (s: string) => void;
  counts: { all: number; draft: number; published: number };
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary px-4 py-3">
      <div className="flex items-center gap-1 rounded-lg border border-secondary bg-secondary p-0.5">
        <Chip active={filter === "all"} onClick={() => onFilterChange("all")}>
          All <Count n={counts.all} />
        </Chip>
        <Chip active={filter === "draft"} onClick={() => onFilterChange("draft")}>
          Drafts <Count n={counts.draft} />
        </Chip>
        <Chip active={filter === "published"} onClick={() => onFilterChange("published")}>
          Published <Count n={counts.published} />
        </Chip>
      </div>
      <label className="flex items-center gap-2 rounded-lg border border-secondary bg-secondary px-2.5 py-1.5 text-sm focus-within:border-tertiary">
        <SearchLg className="size-3.5 shrink-0 text-quaternary" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Filter…"
          className="w-36 bg-transparent text-primary outline-none placeholder:text-quaternary"
        />
      </label>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition",
        active
          ? "bg-primary text-primary shadow-xs ring-1 ring-secondary"
          : "text-secondary hover:text-primary",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Count({ n }: { n: number }) {
  return <span className="font-mono text-xs text-quaternary">{n}</span>;
}

function StatusBadge({ status }: { status: "draft" | "published" }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-utility-green-50 px-2 py-0.5 text-xs font-medium text-utility-green-700 ring-1 ring-utility-green-200 ring-inset">
        <span className="size-1.5 rounded-full bg-utility-green-500" />
        Published
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-utility-neutral-50 px-2 py-0.5 text-xs font-medium text-utility-neutral-700 ring-1 ring-utility-neutral-200 ring-inset">
      <span className="size-1.5 rounded-full bg-utility-neutral-500" />
      Draft
    </span>
  );
}
