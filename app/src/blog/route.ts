// Public blog routing. Singleton store so every useBlogRoute() consumer
// sees the same state — previously each hook had its own useState and only
// the caller's component re-rendered on navigate().
//
// Routes:
//   /        → Home
//   /p/:slug → Single post
//
// The active home tab is component-local state (not in the URL): tab
// clicks shouldn't push history or scroll.

import { useEffect, useState } from "react";

export type BlogRoute =
  | { view: "home" }
  | { view: "post"; slug: string };

function parse(): BlogRoute {
  if (typeof window === "undefined") return { view: "home" };
  const m = window.location.pathname.match(/^\/p\/([^/]+)\/?$/);
  if (m) return { view: "post", slug: decodeURIComponent(m[1]) };
  return { view: "home" };
}

function toPath(r: BlogRoute): string {
  return r.view === "post" ? `/p/${encodeURIComponent(r.slug)}` : "/";
}

// --- singleton store ---
let current: BlogRoute = parse();
const listeners = new Set<(r: BlogRoute) => void>();
function emit() {
  for (const l of listeners) l(current);
}

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    current = parse();
    emit();
  });
}

export function navigateTo(r: BlogRoute, opts?: { replace?: boolean }) {
  const path = toPath(r);
  if (typeof window !== "undefined" && window.location.pathname !== path) {
    if (opts?.replace) window.history.replaceState({}, "", path);
    else window.history.pushState({}, "", path);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  current = r;
  emit();
}

export function useBlogRoute(): [BlogRoute, typeof navigateTo] {
  const [route, setRoute] = useState<BlogRoute>(current);
  useEffect(() => {
    const fn = (r: BlogRoute) => setRoute(r);
    listeners.add(fn);
    // Sync in case the singleton moved between mount and subscribe.
    setRoute(current);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return [route, navigateTo];
}

export function postHref(slug: string): string {
  return toPath({ view: "post", slug });
}
