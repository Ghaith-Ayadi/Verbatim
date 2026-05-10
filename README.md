# Verbatim

Local-first writing tool. Replaces the Payload admin on the existing blog. See [PRD.md](PRD.md).

## Layout

```
.
├── app/          Vite + React editor (Phase 1.1+)
├── mcp-server/   Node MCP server for Claude Code (Phase 1.4)
├── scripts/      Migration + one-off node scripts (uses pg directly)
└── PRD.md
```

## Setup

```sh
cp .env.example .env.local
# Fill in SUPABASE_DB_PASSWORD (for scripts/) and SUPABASE_SERVICE_ROLE_KEY (for MCP)
```

## Scripts

```sh
cd scripts
npm install
npm run migrate           # apply every scripts/sql/*.sql in order
npm run lexical-to-md     # convert posts.content (Lexical jsonb) → posts.content_md
```

The migration runner discovers the Supabase pooler region by probing common AWS regions and saves applied migrations in `public._verbatim_migrations`.

## App

```sh
cd app
npm install
npm run dev               # http://localhost:5173
npm run build
npm run typecheck
```

### Keyboard

| Shortcut       | Action                  |
| -------------- | ----------------------- |
| `⌘K`           | Command palette (search + commands with `>`) |
| `⌘\`           | Toggle author mode (hide sidebar + attributes) |
| `⌘⇧S`          | Manual version snapshot |
| `[[query`      | Wikilink autocomplete   |

### Architecture notes

- **Dexie (IDB)** is the source of truth for the UI. Edits are local-first; the sync engine pushes dirty rows after 2 s of idle and on `blur` / `beforeunload`.
- **Supabase Realtime** subscribes to `posts` + `post_versions` and reconciles into Dexie. Conflict policy: server wins unless local row is `dirty` with a newer `updatedAt` than the inbound row.
- **MiniSearch** is rebuilt in-memory whenever `db.posts` changes (debounced 250 ms). 217 posts → <10 ms rebuild.
- **BlockNote** is mounted once and the document is swapped via `replaceBlocks` on slug change — no remount.
- **Versions** are written client-side directly to Supabase. The trigger model from the PRD is implemented as application code (snapshot on publish, on `⌘⇧S`, on revert).

### Known gaps vs. PRD

- TanStack Router not used — replaced with a tiny `useRoute` hook backed by `location.hash`. With only two views it wasn't worth the wiring.
- No tag input UI yet (the `posts_tags` Payload join table is untouched; we'll surface it in 1.x).
- MCP server (`mcp-server/`) is empty — Phase 1.4.

## Database

Existing Supabase project `REDACTED_PROJECT_REF`. Phase 1.0 migrations live in [scripts/sql](scripts/sql).

| Table             | Added                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------- |
| `posts`           | `content_md` (text), `collection_id` (uuid), `favorited` (bool), `updated_at` trigger |
| `collections`     | new — sidebar groups                                                                   |
| `post_versions`   | new — append-only history                                                              |
| `storage.buckets` | `verbatim` bucket for image uploads                                                    |

The original `posts.content` jsonb (Lexical) is left in place for now; drop it once you're confident `content_md` is the source of truth.
