-- Key/value settings store. Values are jsonb so each setting can hold whatever
-- shape it needs (a string for the bio, a URL for the favicon, etc.).

create table if not exists public.app_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

create or replace function public.touch_app_settings_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

drop trigger if exists app_settings_touch on public.app_settings;
create trigger app_settings_touch
  before update on public.app_settings
  for each row execute function public.touch_app_settings_updated_at();

-- Realtime so admin edits propagate to open reader tabs.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='app_settings'
  ) then
    execute 'alter publication supabase_realtime add table public.app_settings';
  end if;
end$$;
