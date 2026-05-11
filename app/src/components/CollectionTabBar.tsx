import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { go } from "@/lib/route";
import { collectionDisplay } from "@/lib/collections";
import { useActiveCollection } from "@/lib/activeCollection";
import type { Collection } from "@/types";

/**
 * Persistent collection tab strip. Lives at the top of the main panel
 * regardless of route — clicking a tab sets the active collection and
 * navigates home, so a post is never a dead-end.
 */
export function CollectionTabBar() {
  const collections = useLiveQuery(
    () => db.collections.orderBy("position").toArray(),
    [],
    [] as Collection[],
  );
  const [active] = useActiveCollection();

  if (!collections.length) return null;

  const resolvedActive =
    active && collections.some((c) => c.name === active) ? active : collections[0].name;

  return (
    <nav
      role="tablist"
      className="flex items-center gap-1 overflow-x-auto border-b border-secondary px-4"
    >
      {collections.map((c) => {
        const d = collectionDisplay(c.name, collections);
        const isActive = c.name === resolvedActive;
        return (
          <button
            key={c.name}
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              // Always send the user home for this collection. From a post
              // that's "going back"; from home it's just a tab switch.
              go({ view: "list" });
              // Defer so the route change settles before the new active
              // collection takes effect.
              queueMicrotask(() => {
                import("@/lib/activeCollection").then((m) => m.setActiveCollection(c.name));
              });
            }}
            className={[
              "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition",
              isActive
                ? "border-fg-brand-primary text-primary"
                : "border-transparent text-tertiary hover:text-secondary",
            ].join(" ")}
          >
            {d.emoji && <span className="text-base leading-none">{d.emoji}</span>}
            <span className="font-medium">{d.label || c.name}</span>
          </button>
        );
      })}
    </nav>
  );
}
