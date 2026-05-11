// Persistent "currently selected collection" across views.
// - Home renders the active collection's body.
// - When editing a post, the tab matching the post's `type` highlights.
// - Clicking a tab from anywhere navigates home with that collection active.

import { useEffect, useState } from "react";

const STORAGE_KEY = "verbatim:activeCollection";

const listeners = new Set<(v: string | null) => void>();
let current: string | null =
  typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;

export function getActiveCollection(): string | null {
  return current;
}

export function setActiveCollection(name: string | null) {
  if (name === current) return;
  current = name;
  if (typeof localStorage !== "undefined") {
    if (name) localStorage.setItem(STORAGE_KEY, name);
    else localStorage.removeItem(STORAGE_KEY);
  }
  for (const l of listeners) l(name);
}

export function useActiveCollection(): [string | null, (n: string | null) => void] {
  const [state, setState] = useState<string | null>(current);
  useEffect(() => {
    const fn = (v: string | null) => setState(v);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return [state, setActiveCollection];
}
