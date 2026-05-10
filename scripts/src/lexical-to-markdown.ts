// Walks every post.content (Payload Lexical jsonb), produces Markdown,
// writes into posts.content_md. Idempotent: re-running overwrites content_md.

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

// ---- Lexical format bitmask ----
// 1=bold, 2=italic, 4=strike, 8=underline, 16=code, 32=sub, 64=sup, 128=highlight
const F_BOLD = 1, F_ITALIC = 2, F_STRIKE = 4, F_CODE = 16;

function escMd(s: string): string {
  // Conservative escape: backslash-escape characters that start markdown constructs at line edges.
  // We don't try to be exhaustive — these are personal-blog posts, not arbitrary input.
  return s.replace(/([\\`*_])/g, "\\$1");
}

function renderText(node: any): string {
  let text = String(node.text ?? "");
  const fmt = Number(node.format ?? 0);
  if (!text) return "";
  let out = escMd(text);
  if (fmt & F_CODE) out = "`" + text + "`"; // code wins: no further escaping
  if (fmt & F_STRIKE) out = `~~${out}~~`;
  if (fmt & F_ITALIC) out = `_${out}_`;
  if (fmt & F_BOLD) out = `**${out}**`;
  return out;
}

function renderInline(children: any[]): string {
  return (children ?? []).map((c) => {
    if (c?.type === "text") return renderText(c);
    if (c?.type === "linebreak") return "  \n";
    // Unknown inline: fall back to its children's text
    if (Array.isArray(c?.children)) return renderInline(c.children);
    if (typeof c?.text === "string") return renderText(c);
    return "";
  }).join("");
}

function renderList(node: any, depth = 0): string {
  const ordered = node.listType === "number" || node.tag === "ol";
  const pad = "  ".repeat(depth);
  const lines: string[] = [];
  let n = Number(node.start ?? 1);
  for (const item of node.children ?? []) {
    if (item.type !== "listitem") continue;
    // listitem children: text/inline nodes, optionally followed by a nested list
    const inlineChildren: any[] = [];
    const nestedLists: any[] = [];
    for (const c of item.children ?? []) {
      if (c?.type === "list") nestedLists.push(c);
      else inlineChildren.push(c);
    }
    const bullet = ordered ? `${n}.` : "-";
    n++;
    lines.push(`${pad}${bullet} ${renderInline(inlineChildren)}`);
    for (const nested of nestedLists) {
      lines.push(renderList(nested, depth + 1));
    }
  }
  return lines.join("\n");
}

function renderBlock(node: any): string {
  switch (node.type) {
    case "paragraph": {
      const inline = renderInline(node.children);
      return inline; // blank line separation handled by joiner
    }
    case "heading": {
      const tag = String(node.tag ?? "h2").toLowerCase();
      const level = Math.max(1, Math.min(6, Number(tag.replace("h", "")) || 2));
      return `${"#".repeat(level)} ${renderInline(node.children)}`;
    }
    case "list": {
      return renderList(node, 0);
    }
    case "quote": {
      const inline = renderInline(node.children);
      return inline.split("\n").map((l) => `> ${l}`).join("\n");
    }
    case "horizontalrule":
      return "---";
    case "linebreak":
      return "";
    default:
      // Unknown block: try to recover text
      if (Array.isArray(node.children)) return renderInline(node.children);
      return "";
  }
}

export function lexicalToMarkdown(content: any): string {
  const root = content?.root ?? content;
  if (!root || !Array.isArray(root.children)) return "";
  const blocks = root.children.map(renderBlock).filter((b: string) => b !== null && b !== undefined);
  // Single blank line between blocks; trim trailing whitespace
  return blocks.join("\n\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

// ---- main ----
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();
console.log(`Connected to ${ref}`);

const force = process.argv.includes("--force");

const r = await client.query<{ id: number; title: string; content: any; content_md: string | null }>(
  "select id, title, content, content_md from public.posts where content is not null order by id"
);

let converted = 0, skipped = 0;
for (const row of r.rows) {
  if (!force && row.content_md != null && row.content_md.length > 0) {
    skipped++;
    continue;
  }
  const md = lexicalToMarkdown(row.content);
  await client.query("update public.posts set content_md = $1 where id = $2", [md, row.id]);
  converted++;
  if (converted % 25 === 0) console.log(`  · ${converted} converted...`);
}

console.log(`\nDone: ${converted} converted, ${skipped} skipped (already have content_md).`);
console.log("Re-run with --force to overwrite.");

await client.end();
