// One-shot: count words in posts.content_md and write to posts.word_count.
// Whitespace-tokenized after stripping common Markdown markers.

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

function countWords(md: string | null | undefined): number {
  if (!md) return 0;
  // Strip code fences and inline code so we don't count language hints.
  const stripped = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    // Drop markdown syntax characters that aren't words.
    .replace(/[#*_>\-`\[\]()!]/g, " ");
  const tokens = stripped.split(/\s+/).filter(Boolean);
  return tokens.length;
}

await c.connect();
console.log(`Connected to ${ref}`);

const { rows } = await c.query<{ id: number; content_md: string | null }>(
  "select id, content_md from public.posts order by id",
);
console.log(`Backfilling word_count for ${rows.length} posts…`);

await c.query("begin");
try {
  let n = 0;
  for (const r of rows) {
    const wc = countWords(r.content_md);
    await c.query("update public.posts set word_count = $1 where id = $2", [wc, r.id]);
    n++;
    if (n % 50 === 0) console.log(`  · ${n} updated`);
  }
  await c.query("commit");
  console.log(`Done: ${n} posts.`);
} catch (err) {
  await c.query("rollback");
  console.error("Rolled back:", err);
  process.exit(1);
} finally {
  await c.end();
}
