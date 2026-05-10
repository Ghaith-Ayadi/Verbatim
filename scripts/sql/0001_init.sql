-- Verbatim Phase 1.0 — schema bootstrap
-- Idempotent: safe to run multiple times.
-- Notes:
--  - posts.id and users.id are integer (Payload schema). We keep them as-is.
--  - Existing content column is jsonb (Lexical). We add content_md text alongside;
--    the converter script populates it. Once stable we can drop the jsonb column.

-- 1. collections
create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  user_id     integer not null references public.users(id) on delete cascade,
  name        text not null,
  position    int  not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists collections_user_idx on public.collections (user_id);

-- 2. posts.collection_id
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'posts' and column_name = 'collection_id'
  ) then
    alter table public.posts add column collection_id uuid references public.collections(id) on delete set null;
    create index posts_collection_idx on public.posts (collection_id);
  end if;
end$$;

-- 3. posts.content_md (Markdown, owned by Verbatim — alongside the old Lexical jsonb)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'posts' and column_name = 'content_md'
  ) then
    alter table public.posts add column content_md text;
  end if;
end$$;

-- 4. posts.favorited (sidebar Favorites group)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'posts' and column_name = 'favorited'
  ) then
    alter table public.posts add column favorited boolean not null default false;
  end if;
end$$;

-- 5. post_versions (append-only history)
create table if not exists public.post_versions (
  id          uuid primary key default gen_random_uuid(),
  post_id     integer not null references public.posts(id) on delete cascade,
  version     int not null,
  content     text not null,
  attributes  jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  created_by  text not null check (created_by in ('user','mcp:claude-code','migration')),
  message     text,
  unique (post_id, version)
);

create index if not exists post_versions_by_post on public.post_versions (post_id, version desc);

-- 6. posts.updated_at trigger: Payload sets updated_at on its own updates,
--    but Verbatim writes via supabase-js need it auto-bumped too.
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

drop trigger if exists posts_touch_updated_at on public.posts;
create trigger posts_touch_updated_at
  before update on public.posts
  for each row execute function public.touch_updated_at();

-- 7. Realtime: publish posts + post_versions + collections
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'posts'
  ) then
    execute 'alter publication supabase_realtime add table public.posts';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'post_versions'
  ) then
    execute 'alter publication supabase_realtime add table public.post_versions';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'collections'
  ) then
    execute 'alter publication supabase_realtime add table public.collections';
  end if;
end$$;
