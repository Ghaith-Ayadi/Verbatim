// Light / dark theme. Genesis's CSS keys off the `.dark-mode` class on the
// root element — we just add/remove it.

import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const KEY = "verbatim:theme";

function read(): Theme {
  if (typeof localStorage !== "undefined") {
    const raw = localStorage.getItem(KEY);
    if (raw === "light" || raw === "dark") return raw;
  }
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return "dark";
}

function apply(t: Theme) {
  if (typeof document === "undefined") return;
  if (t === "dark") document.documentElement.classList.add("dark-mode");
  else document.documentElement.classList.remove("dark-mode");
}

let current: Theme = read();
apply(current);

const listeners = new Set<(t: Theme) => void>();

export function getTheme(): Theme {
  return current;
}

export function setTheme(t: Theme): void {
  if (t === current) return;
  current = t;
  if (typeof localStorage !== "undefined") localStorage.setItem(KEY, t);
  apply(t);
  for (const l of listeners) l(t);
}

export function toggleTheme(): void {
  setTheme(current === "dark" ? "light" : "dark");
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const [v, setV] = useState<Theme>(current);
  useEffect(() => {
    const fn = (t: Theme) => setV(t);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return [v, setTheme];
}
