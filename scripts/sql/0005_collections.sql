-- Collections become first-class: name, emoji, description, position.
-- `posts.type` is still the join key (text) so renames are scoped to an
-- application-level batch update.

drop table if exists public.collection_meta;  -- never used in production

create table if not exists public.collections (
  name         text primary key,
  emoji        text,
  description  text,
  position     int  not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create or replace function public.touch_collections_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

drop trigger if exists collections_touch on public.collections;
create trigger collections_touch
  before update on public.collections
  for each row execute function public.touch_collections_updated_at();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='collections'
  ) then
    execute 'alter publication supabase_realtime add table public.collections';
  end if;
end$$;

-- Backfill: one row per distinct posts.type, ordered by post count (most
-- populous gets position 0). Idempotent.
insert into public.collections (name, position)
select t.type, (row_number() over (order by count(*) desc) - 1)::int
from public.posts t
where t.type is not null and t.type <> ''
group by t.type
on conflict (name) do nothing;
