// Tiny URL state hook. Routes by post ID (not slug) so editing the slug
// in the attribute panel doesn't break the page.

import { useEffect, useState } from "react";

export type Route =
  | { view: "list" }
  | { view: "post"; id: number };

function parse(): Route {
  const h = window.location.hash;
  const m = h.match(/^#\/post\/(\d+)$/);
  if (m) return { view: "post", id: Number(m[1]) };
  return { view: "list" };
}

function toHash(r: Route): string {
  return r.view === "list" ? "#/" : `#/post/${r.id}`;
}

export function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(parse());
  useEffect(() => {
    const onHash = () => setRoute(parse());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const navigate = (r: Route) => {
    const hash = toHash(r);
    if (window.location.hash !== hash) window.location.hash = hash;
    else setRoute(r);
  };
  return [route, navigate];
}

export function go(r: Route) {
  window.location.hash = toHash(r);
}

export function postHref(id: number): string {
  return `#/post/${id}`;
}
