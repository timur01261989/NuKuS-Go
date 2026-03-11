-- Unified order contract hardening for city taxi and related services.
-- Safe additive migration: does not drop existing columns or tables.

create index if not exists idx_orders_user_active
  on public.orders (user_id, created_at desc)
  where status in ('draft','pending','searching','offered','accepted','arrived','in_progress','in_trip');

create index if not exists idx_orders_driver_active
  on public.orders (driver_id, created_at desc)
  where status in ('accepted','arrived','in_progress','in_trip');

create index if not exists idx_orders_service_status_created
  on public.orders (service_type, status, created_at desc);

create index if not exists idx_order_offers_active_sent
  on public.order_offers (order_id, status, expires_at)
  where status = 'sent';

create index if not exists idx_order_events_order_created
  on public.order_events (order_id, created_at desc);

comment on table public.orders is 'Unified orders table. Source of truth: orders.id, pickup jsonb, dropoff jsonb.';
comment on column public.orders.pickup is 'Unified pickup payload: { address, lat, lng, ... }';
comment on column public.orders.dropoff is 'Unified dropoff payload: { address, lat, lng, ... } or null';
