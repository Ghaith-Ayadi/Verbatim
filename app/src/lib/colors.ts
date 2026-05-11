// Deprecated: colored dots were replaced by the leading-emoji convention
// in `collections.ts`. Kept as a thin shim only so older imports compile;
// no component should still reach for these.

export type Swatch = { name: string; hex: string };
export const PALETTE: Swatch[] = [];

export function collectionColor(_name: string | null | undefined): string {
  return "transparent";
}
export function isCollectionColorOverridden(_name: string): boolean {
  return false;
}
export async function setCollectionColor(_n: string, _h: string): Promise<void> {}
export async function clearCollectionColor(_n: string): Promise<void> {}
export async function installColorOverrides(): Promise<void> {}
export function rememberColor(_n: string, _c: string | null): void {}
export function useColorVersion(): number {
  return 0;
}
