import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { config as loadEnv } from "dotenv";

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(here, "..", "..", ".env.local") });

const url = process.env.VITE_SUPABASE_URL!;
const ref = new URL(url).hostname.split(".")[0];
const password = process.env.SUPABASE_DB_PASSWORD!;
const c = new pg.Client({
  connectionString: `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`,
  ssl: { rejectUnauthorized: false },
});
await c.connect();

const enumValues = await c.query<{ enumlabel: string }>(`
  select e.enumlabel
  from pg_type t
  join pg_enum e on e.enumtypid = t.oid
  where t.typname in (
    select udt_name from information_schema.columns
    where table_schema='public' and table_name='posts' and column_name='type'
  )
  order by e.enumsortorder
`);
console.log("posts.type enum values:");
for (const r of enumValues.rows) console.log("  ·", r.enumlabel);

const counts = await c.query<{ type: string; n: string }>(
  "select type::text as type, count(*)::text as n from public.posts group by type order by n::int desc",
);
console.log("\nposts grouped by type:");
for (const r of counts.rows) console.log(`  ${r.type.padEnd(20)} ${r.n}`);

await c.end();
