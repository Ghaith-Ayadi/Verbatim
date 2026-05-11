// Deterministic Tailwind-500-ish color per collection name.
// Users can override via collection_meta in Supabase; overrides live in a
// module-level map populated from Dexie. `useColorVersion` subscribes
// components to re-render when the map changes.

import { useSyncExternalStore } from "react";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";

export interface Swatch {
  name: string;
  hex: string;
}

export const PALETTE: Swatch[] = [
  { name: "red", hex: "#ef4444" },
  { name: "orange", hex: "#f97316" },
  { name: "amber", hex: "#f59e0b" },
  { name: "yellow", hex: "#eab308" },
  { name: "lime", hex: "#84cc16" },
  { name: "green", hex: "#22c55e" },
  { name: "emerald", hex: "#10b981" },
  { name: "teal", hex: "#14b8a6" },
  { name: "cyan", hex: "#06b6d4" },
  { name: "sky", hex: "#0ea5e9" },
  { name: "blue", hex: "#3b82f6" },
  { name: "indigo", hex: "#6366f1" },
  { name: "violet", hex: "#8b5cf6" },
  { name: "purple", hex: "#a855f7" },
  { name: "fuchsia", hex: "#d946ef" },
  { name: "pink", hex: "#ec4899" },
  { name: "rose", hex: "#f43f5e" },
];

// FNV-1a 32-bit
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const overrides = new Map<string, string>();
const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version++;
  for (const l of listeners) l();
}

export function collectionColor(name: string | null | undefined): string {
  if (!name) return "#737373";
  const over = overrides.get(name);
  if (over) return over;
  return PALETTE[hash(name) % PALETTE.length].hex;
}

export function isCollectionColorOverridden(name: string): boolean {
  return overrides.has(name);
}

export async function setCollectionColor(name: string, hex: string): Promise<void> {
  const now = Date.now();
  overrides.set(name, hex);
  await db.collectionMeta.put({ name, color: hex, updatedAt: now });
  emit();
  const { error } = await supabase
    .from("collection_meta")
    .upsert({ name, color: hex })
    .select();
  if (error) console.error("setCollectionColor failed:", error);
}

export async function clearCollectionColor(name: string): Promise<void> {
  overrides.delete(name);
  await db.collectionMeta.delete(name);
  emit();
  const { error } = await supabase.from("collection_meta").delete().eq("name", name);
  if (error) console.error("clearCollectionColor failed:", error);
}

// Wire Dexie → in-memory map. Called from App on mount.
let installed = false;
export async function installColorOverrides() {
  if (installed) return;
  installed = true;
  const rows = await db.collectionMeta.toArray();
  overrides.clear();
  for (const r of rows) overrides.set(r.name, r.color);
  emit();
}

// Called by realtime + sync code when remote rows arrive / are removed.
export function rememberColor(name: string, color: string | null) {
  if (color == null) overrides.delete(name);
  else overrides.set(name, color);
  emit();
}

export function useColorVersion(): number {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => version,
  );
}
