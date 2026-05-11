// Path-based routing for the public blog. Lives at the root path.
// Editor stays at /admin and continues to use its hash-based routing.

import { useEffect, useState } from "react";

export type BlogRoute =
  | { view: "home" }
  | { view: "post"; slug: string };

function parse(): BlogRoute {
  const m = window.location.pathname.match(/^\/p\/([^/]+)\/?$/);
  if (m) return { view: "post", slug: decodeURIComponent(m[1]) };
  return { view: "home" };
}

export function useBlogRoute(): [BlogRoute, (r: BlogRoute) => void] {
  const [route, setRoute] = useState<BlogRoute>(parse());
  useEffect(() => {
    const onPop = () => setRoute(parse());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const navigate = (r: BlogRoute) => {
    const path = r.view === "home" ? "/" : `/p/${encodeURIComponent(r.slug)}`;
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
      setRoute(r);
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };
  return [route, navigate];
}
