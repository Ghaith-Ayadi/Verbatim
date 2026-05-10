-- Storage bucket for image uploads.
-- Public-read so we can embed the URLs straight into the blog Markdown.
-- (Single-tenant: the only writer is Ghaith, authenticated.)

insert into storage.buckets (id, name, public)
values ('verbatim', 'verbatim', true)
on conflict (id) do nothing;

-- RLS: anyone can read; only authenticated users can write into this bucket.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'verbatim_read'
  ) then
    create policy "verbatim_read" on storage.objects for select
      using (bucket_id = 'verbatim');
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'verbatim_write'
  ) then
    create policy "verbatim_write" on storage.objects for insert to authenticated
      with check (bucket_id = 'verbatim');
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'verbatim_update'
  ) then
    create policy "verbatim_update" on storage.objects for update to authenticated
      using (bucket_id = 'verbatim');
  end if;
end$$;
