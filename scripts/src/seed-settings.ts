// Seeds default app_settings if missing.
// - author.name
// - author.tagline
// - author.bio
// - favicon.url (left null until uploaded from the Settings dialog)

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

const defaults: Record<string, unknown> = {
  "author.name": "Ghaith Ayadi",
  "author.tagline": "Designer of sensible software, writer of Hokum",
  "author.bio":
    "I'm Ghaith Ayadi [ɣaajθ ʕajadiː], Designer of sensible software, writer of Hokum 🍉\n\nWorking remotely from Lisbon · AI free 🥳\n\nProduct designer for SaaS and data heavy platforms. I have experience with early-stage products and a deep understanding of productivity and collaboration software. I also bring experience in highly integrated enterprise systems like supply chain management and capacity planning. Currently an independent consultant for enterprise and venture-backed startups.",
  "author.location": "Lisbon",
  "favicon.url": null,
  "site.title": "Verbatim",
  "site.tagline": "A reading room.",
};

await c.connect();
let n = 0;
for (const [key, value] of Object.entries(defaults)) {
  await c.query(
    "insert into public.app_settings (key, value) values ($1, $2::jsonb) on conflict (key) do nothing",
    [key, JSON.stringify(value)],
  );
  n++;
}
console.log(`Seeded ${n} keys (existing rows untouched).`);
await c.end();
