-- =============================================================================
--  ORDER TRACKER — DATABASE SETUP
--  Paste this WHOLE file into the Supabase SQL Editor and click "Run".
--  (Supabase dashboard -> SQL Editor -> New query -> paste -> Run)
--  Safe to run more than once.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. ORDERS
--    stage: 1 = Order Received, 2 = Sales Documents, 3 = Awaiting Pickup,
--           4 = Completed
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null,
  customer         text not null default '',
  destination      text not null default '',
  notes            text not null default '',
  stage            int  not null default 1,
  created_at       timestamptz not null default now(),  -- when the order was added
  stage_entered_at timestamptz not null default now(),  -- when it entered its CURRENT stage
  completed_at     timestamptz,                         -- set when moved to Completed
  updated_at       timestamptz not null default now(),
  group_id         uuid,                                -- orders sharing this id are grouped
  group_name       text                                 -- optional label for the group
);
create index if not exists orders_group_id_idx on public.orders(group_id);

-- ----------------------------------------------------------------------------
-- 2. BATCHES  (one order can have many batches)
-- ----------------------------------------------------------------------------
create table if not exists public.batches (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  code       text not null default '',
  product    text not null default '',
  packaging  text not null default '',
  quantity   numeric not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists batches_order_id_idx on public.batches(order_id);

-- ----------------------------------------------------------------------------
-- 3. AUDIT LOG  (a permanent record of every action)
--    order_id is kept nullable + ON DELETE SET NULL so the log survives
--    even after an order is deleted. order_number is a text snapshot.
-- ----------------------------------------------------------------------------
create table if not exists public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid references public.orders(id) on delete set null,
  order_number text not null default '',
  action       text not null,   -- created | moved | edited | notes_edited | batches_added | deleted | reopened
  detail       text not null default '',  -- human-readable description
  created_at   timestamptz not null default now()
);
create index if not exists audit_log_created_at_idx on public.audit_log(created_at desc);
create index if not exists audit_log_order_number_idx on public.audit_log(order_number);

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
--    Turn it on, then allow any LOGGED-IN user to do everything.
--    (This app has a single login, so "logged in" = "you".)
-- ----------------------------------------------------------------------------
alter table public.orders    enable row level security;
alter table public.batches   enable row level security;
alter table public.audit_log enable row level security;

-- Re-create policies cleanly so this script is safe to re-run.
drop policy if exists "authenticated full access" on public.orders;
drop policy if exists "authenticated full access" on public.batches;
drop policy if exists "authenticated full access" on public.audit_log;

create policy "authenticated full access" on public.orders
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.batches
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.audit_log
  for all to authenticated using (true) with check (true);

-- ----------------------------------------------------------------------------
-- 5. REALTIME
--    Lets an open page update automatically when data changes elsewhere.
-- ----------------------------------------------------------------------------
do $$
begin
  -- add tables to the realtime publication (ignore if already added)
  begin execute 'alter publication supabase_realtime add table public.orders';    exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.batches';   exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.audit_log'; exception when duplicate_object then null; end;
end $$;

-- Done. You should see "Success. No rows returned".
