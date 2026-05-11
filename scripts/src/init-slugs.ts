// One-shot: rewrite every post's slug + collection_seq into the
// `${PREFIX}·${NN}` scheme.
//
//   PREFIX = first 3 consonants of posts.type (uppercase), falling back
//            to any letters if there aren't 3.
//   NN     = sequence within the collection, zero-padded.
//
// We renumber collection_seq from 1..N per collection (oldest id first) so
// that nulls are filled in and there are no gaps. To avoid colliding with
// the existing UNIQUE index on posts.slug, all slugs are first parked at
// `tmp-<id>` and then rewritten in a single transaction.

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

const VOWELS = new Set("aeiouyAEIOUY");

function collectionPrefix(name: string | null | undefined): string {
  if (!name) return "XXX";
  const letters = [...name].filter((ch) => /[a-zA-Z]/.test(ch));
  const consonants = letters.filter((ch) => !VOWELS.has(ch));
  const pool = consonants.length >= 3 ? consonants : letters;
  return (pool.slice(0, 3).join("").toUpperCase() + "XXX").slice(0, 3);
}

const pad = (n: number) => n.toString().padStart(2, "0");

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();
console.log(`Connected to ${ref}`);

const { rows } = await client.query<{ id: number; type: string | null }>(
  "select id, type from public.posts order by type nulls last, id",
);
console.log(`Initing ${rows.length} posts…`);

const seqByType = new Map<string, number>();
const plan = rows.map((r) => {
  const t = r.type ?? "";
  const next = (seqByType.get(t) ?? 0) + 1;
  seqByType.set(t, next);
  return {
    id: r.id,
    type: t,
    seq: next,
    slug: `${collectionPrefix(t)}·${pad(next)}`,
  };
});

await client.query("begin");
try {
  // Step 1: park every slug at a unique temp value so we don't trip
  // posts_slug_idx during the rewrite.
  for (const p of plan) {
    await client.query("update public.posts set slug = $1 where id = $2", [`__tmp_${p.id}`, p.id]);
  }
  // Step 2: write final slugs + collection_seq.
  let n = 0;
  for (const p of plan) {
    await client.query(
      "update public.posts set slug = $1, collection_seq = $2 where id = $3",
      [p.slug, p.seq, p.id],
    );
    if (++n % 50 === 0) console.log(`  · ${n} updated`);
  }
  await client.query("commit");
  console.log(`Done: ${n} posts.`);
} catch (err) {
  await client.query("rollback");
  console.error("Rolled back:", err);
  process.exit(1);
} finally {
  await client.end();
}
