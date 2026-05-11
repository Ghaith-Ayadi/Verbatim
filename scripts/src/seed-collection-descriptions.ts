// Add descriptions to the three core collections, lifted from the design
// handoff (blog/project/Verbatim.html). Skips any collection that already
// has a non-empty description so manual edits stick.

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

const seeds: Record<string, string> = {
  Briefs: "Short, declarative notes. One idea at a time, written in under an hour.",
  Hokum: "Essays in the long tradition of being wrong about something at length. The main collection.",
  Journal: "Dated entries with no thesis. Mostly observation, mostly Saturday.",
  Verbatim: "Notes about the tool itself — what changed, why, and how it behaves.",
  Test: "Scratch space for trying things out.",
};

await c.connect();
let n = 0;
for (const [name, description] of Object.entries(seeds)) {
  const r = await c.query(
    `update public.collections
       set description = $1
     where name = $2
       and (description is null or description = '')`,
    [description, name],
  );
  if ((r.rowCount ?? 0) > 0) n++;
  console.log(`  · ${name.padEnd(10)} ${r.rowCount ? "set" : "skipped (already set or missing)"}`);
}
console.log(`Done: ${n} updated.`);
await c.end();
