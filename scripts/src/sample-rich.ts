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

const r = await client.query<{ id: number; title: string; content: any }>(
  "select id, title, content from public.posts where content is not null"
);

const wantTypes = new Set(["heading", "list", "listitem", "quote", "horizontalrule"]);
const found: Record<string, any> = {};

function walk(node: any) {
  if (!node || typeof node !== "object") return;
  if (node.type && wantTypes.has(node.type) && !found[node.type]) {
    found[node.type] = node;
  }
  if (Array.isArray(node.children)) for (const c of node.children) walk(c);
  if (node.root) walk(node.root);
}

for (const row of r.rows) {
  walk(row.content);
  if (Object.keys(found).length === wantTypes.size) break;
}

for (const [t, node] of Object.entries(found)) {
  console.log(`\n=== ${t} ===`);
  console.log(JSON.stringify(node, null, 2).slice(0, 1500));
}

await client.end();
