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

const r = await client.query<{ id: number; title: string; content: unknown }>(
  "select id, title, content from public.posts where content is not null order by id desc limit 2"
);
for (const row of r.rows) {
  console.log(`\n=== post ${row.id}: ${row.title} ===`);
  console.log(JSON.stringify(row.content, null, 2).slice(0, 4000));
  console.log("---");
}

await client.end();
