-- Unified order contract indexes and compatibility helpers
create index if not exists idx_orders_client_status_created_at
  on public.orders (client_id, status, created_at desc);

create index if not exists idx_orders_driver_status_created_at
  on public.orders (driver_id, status, created_at desc);

create index if not exists idx_orders_service_status_created_at
  on public.orders (service_type, status, created_at desc);

create index if not exists idx_order_offers_order_status_expires
  on public.order_offers (order_id, status, expires_at desc);

comment on column public.orders.pickup is 'Unified pickup jsonb shape: { address, lat, lng, region?, district? }';
comment on column public.orders.dropoff is 'Unified dropoff jsonb shape: { address, lat, lng, region?, district? } or null';
