import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { config as loadEnv } from "dotenv";

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(here, "..", "..", ".env.local") });

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!url) {
  console.error("Missing VITE_SUPABASE_URL");
  process.exit(1);
}
if (!dbPassword) {
  console.error("Missing SUPABASE_DB_PASSWORD in .env.local");
  process.exit(1);
}

const ref = new URL(url).hostname.split(".")[0];

const POOLER_REGIONS = [
  "eu-central-1",
  "eu-west-1",
  "eu-west-2",
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-south-1",
  "sa-east-1",
  "ca-central-1",
];

function buildUrl(prefix: string, region: string): string {
  return `postgresql://postgres.${ref}:${encodeURIComponent(dbPassword!)}@${prefix}-${region}.pooler.supabase.com:5432/postgres`;
}

async function pickConnectionString(): Promise<string> {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;
  if (process.env.SUPABASE_POOLER_REGION) {
    return buildUrl(process.env.SUPABASE_POOLER_PREFIX ?? "aws-1", process.env.SUPABASE_POOLER_REGION);
  }

  let lastErr: Error | undefined;
  for (const prefix of ["aws-1", "aws-0"]) {
    for (const region of POOLER_REGIONS) {
      const url = buildUrl(prefix, region);
      const probe = new pg.Client({ connectionString: url, connectionTimeoutMillis: 4000, ssl: { rejectUnauthorized: false } });
      try {
        await probe.connect();
        await probe.end();
        console.log(`  · pooler: ${prefix}-${region}`);
        return url;
      } catch (err) {
        lastErr = err as Error;
        try { await probe.end(); } catch {}
      }
    }
  }
  throw new Error(`Could not find pooler region. Last error: ${lastErr?.message}`);
}

const connectionString = await pickConnectionString();

const sqlDir = join(here, "..", "sql");
const files = readdirSync(sqlDir).filter((f) => f.endsWith(".sql")).sort();

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

await client.connect();
console.log(`Connected to project ${ref}`);

await client.query(`
  create table if not exists public._verbatim_migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  );
`);

const applied = new Set(
  (await client.query<{ name: string }>("select name from public._verbatim_migrations")).rows.map(
    (r) => r.name,
  ),
);

for (const file of files) {
  if (applied.has(file)) {
    console.log(`  · skip ${file} (already applied)`);
    continue;
  }
  const sql = readFileSync(join(sqlDir, file), "utf8");
  console.log(`  → apply ${file}`);
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into public._verbatim_migrations (name) values ($1)", [file]);
    await client.query("commit");
    console.log(`    ✓ ${file}`);
  } catch (err) {
    await client.query("rollback");
    console.error(`    ✗ ${file}:`, (err as Error).message);
    process.exit(1);
  }
}

await client.end();
console.log("Done.");
