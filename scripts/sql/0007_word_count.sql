-- Word count for sortable, lazy-loaded display in the post table.
-- We don't try to compute it in SQL — the converter / editor maintain it.

alter table public.posts add column if not exists word_count int;
create index if not exists posts_word_count_idx on public.posts (word_count);
