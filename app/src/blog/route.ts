// Path-based routing for the public blog.
//
//   /               → Home (default collection)
//   /c/:name        → Home with a specific collection open
//   /p/:slug        → Single post
//
// Editor lives separately under /admin and uses its own hash routing.

import { useEffect, useState } from "react";

export type BlogRoute =
  | { view: "home" }
  | { view: "collection"; name: string }
  | { view: "post"; slug: string };

function parse(): BlogRoute {
  const path = window.location.pathname;
  let m = path.match(/^\/p\/([^/]+)\/?$/);
  if (m) return { view: "post", slug: decodeURIComponent(m[1]) };
  m = path.match(/^\/c\/([^/]+)\/?$/);
  if (m) return { view: "collection", name: decodeURIComponent(m[1]) };
  return { view: "home" };
}

function toPath(r: BlogRoute): string {
  if (r.view === "post") return `/p/${encodeURIComponent(r.slug)}`;
  if (r.view === "collection") return `/c/${encodeURIComponent(r.name)}`;
  return "/";
}

export function useBlogRoute(): [BlogRoute, (r: BlogRoute, opts?: { replace?: boolean }) => void] {
  const [route, setRoute] = useState<BlogRoute>(parse());
  useEffect(() => {
    const onPop = () => setRoute(parse());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const navigate = (r: BlogRoute, opts?: { replace?: boolean }) => {
    const path = toPath(r);
    if (window.location.pathname !== path) {
      if (opts?.replace) window.history.replaceState({}, "", path);
      else window.history.pushState({}, "", path);
      setRoute(r);
      window.scrollTo({ top: 0, behavior: "instant" });
    } else {
      // URL unchanged but caller intended a state sync — still update React.
      setRoute(r);
    }
  };
  return [route, navigate];
}

export function collectionHref(name: string): string {
  return toPath({ view: "collection", name });
}

export function postHref(slug: string): string {
  return toPath({ view: "post", slug });
}
