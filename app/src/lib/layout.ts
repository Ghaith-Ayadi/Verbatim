// Sidebar / attribute panel visibility — persisted in localStorage.
// Author mode = both panels hidden.

import { useEffect, useState } from "react";

const STORAGE_KEY = "verbatim:layout";

interface Layout {
  sidebar: boolean;
  attributes: boolean;
}

function read(): Layout {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { sidebar: true, attributes: true };
}

function write(l: Layout) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(l));
}

const listeners = new Set<(l: Layout) => void>();
let current = read();

export function useLayout(): [Layout, (patch: Partial<Layout>) => void, () => void] {
  const [state, setState] = useState(current);
  useEffect(() => {
    const fn = (l: Layout) => setState(l);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  const update = (patch: Partial<Layout>) => {
    current = { ...current, ...patch };
    write(current);
    for (const l of listeners) l(current);
  };

  const toggleAuthorMode = () => {
    const hidden = !state.sidebar && !state.attributes;
    update(hidden ? { sidebar: true, attributes: true } : { sidebar: false, attributes: false });
  };

  return [state, update, toggleAuthorMode];
}
