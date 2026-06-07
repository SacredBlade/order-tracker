-- =============================================================================
--  MIGRATION: add order grouping
--  Run this ONCE in the Supabase SQL Editor if you already set up the database
--  before grouping existed. Safe to run more than once.
-- =============================================================================

alter table public.orders add column if not exists group_id   uuid;
alter table public.orders add column if not exists group_name text;

create index if not exists orders_group_id_idx on public.orders(group_id);

-- Done.
