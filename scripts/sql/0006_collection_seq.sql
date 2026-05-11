-- Per-collection sequential id (1, 2, 3 … within each posts.type).
-- New posts get the next free seq; existing posts are backfilled by id order.
-- Slug becomes the seq as text. Old posts keep their slug.

alter table public.posts add column if not exists collection_seq int;

-- Backfill (only rows that still have null seq).
with numbered as (
  select id,
         row_number() over (partition by type order by id) as seq
  from public.posts
  where collection_seq is null
)
update public.posts p set collection_seq = n.seq
from numbered n
where p.id = n.id;

create index if not exists posts_collection_seq_idx on public.posts (type, collection_seq);
