-- Per-collection user preferences. Today: just the color.
-- Single-tenant: no user_id column.
create table if not exists public.collection_meta (
  name        text primary key,
  color       text not null,
  updated_at  timestamptz not null default now()
);

create or replace function public.touch_collection_meta_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

drop trigger if exists collection_meta_touch on public.collection_meta;
create trigger collection_meta_touch
  before update on public.collection_meta
  for each row execute function public.touch_collection_meta_updated_at();

-- Realtime publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'collection_meta'
  ) then
    execute 'alter publication supabase_realtime add table public.collection_meta';
  end if;
end$$;
