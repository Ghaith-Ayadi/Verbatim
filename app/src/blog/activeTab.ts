// Which home tab is active. Persisted in localStorage so refreshes preserve
// it, but **not** in the URL — tab clicks shouldn't push history or scroll.

import { useEffect, useState } from "react";

const KEY = "verbatim:activeTab";
const listeners = new Set<(v: string | null) => void>();
let current: string | null =
  typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;

export function getActiveTab(): string | null {
  return current;
}

export function setActiveTab(name: string | null) {
  if (current === name) return;
  current = name;
  if (typeof localStorage !== "undefined") {
    if (name) localStorage.setItem(KEY, name);
    else localStorage.removeItem(KEY);
  }
  for (const l of listeners) l(name);
}

export function useActiveTab(): [string | null, (n: string | null) => void] {
  const [v, set] = useState<string | null>(current);
  useEffect(() => {
    const fn = (x: string | null) => set(x);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return [v, setActiveTab];
}
