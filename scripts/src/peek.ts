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
const c = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await c.connect();
const r = await c.query("select id, title, content_md from public.posts where content_md is not null order by random() limit 3");
for (const row of r.rows) {
  console.log(`\n=== ${row.id}: ${row.title} ===`);
  console.log(row.content_md.slice(0, 800));
}
await c.end();
