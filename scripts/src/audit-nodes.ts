// Walk every post's content tree and count distinct node types
// so we know what the converter has to support.

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { config as loadEnv } from "dotenv";

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(here, "..", "..", ".env.local") });

const url = process.env.VITE_SUPABASE_URL!;
const ref = new URL(url).hostname.split(".")[0];
const password = process.env.SUPABASE_DB_PASSWORD!;
const connectionString = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`;

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();

const r = await client.query<{ id: number; content: any }>(
  "select id, content from public.posts where content is not null"
);

const types = new Map<string, number>();
const formatBits = new Set<number>();
const detailBits = new Set<number>();

function walk(node: any) {
  if (!node || typeof node !== "object") return;
  if (node.type) types.set(node.type, (types.get(node.type) ?? 0) + 1);
  if (typeof node.format === "number") formatBits.add(node.format);
  if (typeof node.detail === "number") detailBits.add(node.detail);
  if (Array.isArray(node.children)) for (const c of node.children) walk(c);
  if (node.root) walk(node.root);
}

for (const row of r.rows) walk(row.content);

console.log("Node types used across all posts:");
for (const [t, n] of [...types.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${t.padEnd(25)} ${n}`);
}
console.log("\nText format bitmasks observed:", [...formatBits].sort((a, b) => a - b));
console.log("Text detail bitmasks observed:", [...detailBits].sort((a, b) => a - b));

await client.end();
