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

const counts = await c.query<{ type: string; n: string; min: string; max: string }>(`
  select type, count(*)::text n, min(slug) min, max(slug) max
  from public.posts group by type order by type
`);
for (const r of counts.rows) console.log(`  ${r.type.padEnd(15)} ${r.n.padEnd(5)} ${r.min} … ${r.max}`);

await c.end();
