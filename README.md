# Verbatim

Local-first writing tool. Replaces the Payload admin on the existing blog. See [PRD.md](PRD.md) for the full spec.

## Layout

```
.
├── app/          Vite + React editor (Phase 1.1+)
├── mcp-server/   Node MCP server for Claude Code (Phase 1.4)
└── PRD.md
```

## Setup

```sh
cp .env.example .env.local
# Fill in SUPABASE_SERVICE_ROLE_KEY for migration / MCP work
```
