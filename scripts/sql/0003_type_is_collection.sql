-- Reframe: posts.type IS the collection. Drop the separate collections table.
-- Convert posts.type from enum → text so adding a new collection is just a row update.

-- 1. Drop posts.collection_id (added in 0001 but never populated)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='posts' and column_name='collection_id'
  ) then
    alter table public.posts drop column collection_id;
  end if;
end$$;

-- 2. Drop the collections table (empty — created in 0001)
drop table if exists public.collections;

-- 3. Alter posts.type from enum → text
do $$
declare
  enum_typname text;
begin
  select udt_name into enum_typname
  from information_schema.columns
  where table_schema='public' and table_name='posts' and column_name='type';

  if enum_typname is not null and exists (select 1 from pg_type where typname = enum_typname and typtype = 'e') then
    alter table public.posts alter column type type text using type::text;
    -- Drop the now-unused enum, if nothing else references it.
    if not exists (
      select 1 from information_schema.columns
      where udt_name = enum_typname and not (table_schema='public' and table_name='posts' and column_name='type')
    ) then
      execute format('drop type if exists public.%I', enum_typname);
    end if;
  end if;
end$$;
