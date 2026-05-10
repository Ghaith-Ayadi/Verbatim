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

const tables = await client.query<{ table_name: string }>(`
  select table_name from information_schema.tables
  where table_schema = 'public' order by table_name
`);
console.log("Tables in public:");
for (const t of tables.rows) console.log("  ·", t.table_name);

for (const t of ["posts", "users", "media", "pages"]) {
  const exists = tables.rows.some((r) => r.table_name === t);
  if (!exists) continue;
  console.log(`\n${t} columns:`);
  const cols = await client.query<{ column_name: string; data_type: string; is_nullable: string }>(`
    select column_name, data_type, is_nullable
    from information_schema.columns
    where table_schema='public' and table_name=$1
    order by ordinal_position
  `, [t]);
  for (const c of cols.rows) {
    console.log(`  ${c.column_name.padEnd(30)} ${c.data_type.padEnd(30)} ${c.is_nullable}`);
  }
}

const count = await client.query<{ n: string }>("select count(*)::text as n from public.posts");
console.log(`\nposts row count: ${count.rows[0].n}`);

await client.end();
