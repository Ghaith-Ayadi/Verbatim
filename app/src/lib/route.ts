// Tiny URL state hook. PRD called for TanStack Router but at MVP scope
// (3 views, no nested data deps) the runtime + boilerplate isn't worth it.

import { useEffect, useState } from "react";

export type Route =
  | { view: "list" }
  | { view: "post"; slug: string };

function parse(): Route {
  const h = window.location.hash;
  const m = h.match(/^#\/post\/(.+)$/);
  if (m) return { view: "post", slug: decodeURIComponent(m[1]) };
  return { view: "list" };
}

export function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(parse());
  useEffect(() => {
    const onHash = () => setRoute(parse());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const navigate = (r: Route) => {
    const hash = r.view === "list" ? "#/" : `#/post/${encodeURIComponent(r.slug)}`;
    if (window.location.hash !== hash) window.location.hash = hash;
    else setRoute(r);
  };
  return [route, navigate];
}

export function go(r: Route) {
  const hash = r.view === "list" ? "#/" : `#/post/${encodeURIComponent(r.slug)}`;
  window.location.hash = hash;
}
