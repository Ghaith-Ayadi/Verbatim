// LCS-based line diff. Returns a sequence of ops describing how
// to transform `a` into `b`. Good enough for prose; not optimal
// for huge inputs but fine for blog posts.

export type DiffOp =
  | { kind: "same"; line: string }
  | { kind: "add"; line: string }
  | { kind: "remove"; line: string };

export function diffLines(a: string, b: string): DiffOp[] {
  const A = a.split("\n");
  const B = b.split("\n");
  const m = A.length, n = B.length;
  // LCS table
  const t: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      t[i][j] = A[i] === B[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
    }
  }
  const out: DiffOp[] = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (A[i] === B[j]) { out.push({ kind: "same", line: A[i] }); i++; j++; }
    else if (t[i + 1][j] >= t[i][j + 1]) { out.push({ kind: "remove", line: A[i] }); i++; }
    else { out.push({ kind: "add", line: B[j] }); j++; }
  }
  while (i < m) out.push({ kind: "remove", line: A[i++] });
  while (j < n) out.push({ kind: "add", line: B[j++] });
  return out;
}
