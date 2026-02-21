-- Yandex-style ORDER extensions (add-only). Safe to run multiple times.
-- Adds richer route object, ETA, polyline, linked orders, and offer timeouts.

alter table if exists orders
  add column if not exists pickup jsonb,
  add column if not exists dropoff jsonb,
  add column if not exists route jsonb,
  add column if not exists polyline text,
  add column if not exists eta_seconds int,
  add column if not exists status_reason text;

-- linked orders (multi-order / chained)
create table if not exists linked_orders (
  id uuid primary key default gen_random_uuid(),
  parent_order_id uuid not null references orders(id) on delete cascade,
  child_order_id uuid not null references orders(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(parent_order_id, child_order_id)
);
create index if not exists idx_linked_parent on linked_orders(parent_order_id);
create index if not exists idx_linked_child on linked_orders(child_order_id);

-- offer timeout helper (optional): mark old sent offers as timeout
-- You can run periodically via cron.
