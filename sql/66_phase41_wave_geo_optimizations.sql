begin;

create extension if not exists cube;
create extension if not exists earthdistance;

create table if not exists public.dispatch_wave_offers (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  driver_id uuid not null,
  wave_index integer not null default 1,
  offer_status text not null default 'sent',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique(order_id, driver_id, wave_index)
);

create index if not exists idx_dispatch_wave_offers_order_wave
on public.dispatch_wave_offers(order_id, wave_index, offer_status);

create table if not exists public.driver_location_snapshots (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null,
  lat double precision not null,
  lng double precision not null,
  source text not null default 'redis_geo_sync',
  created_at timestamptz not null default now()
);

create index if not exists idx_driver_location_snapshots_driver_created
on public.driver_location_snapshots(driver_id, created_at desc);

commit;
