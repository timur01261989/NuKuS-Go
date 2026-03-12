create table if not exists public.trip_inventory_holds (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  user_id uuid null,
  seats integer not null default 1,
  hold_token text not null unique,
  status text not null default 'held',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists trip_inventory_holds_trip_id_idx on public.trip_inventory_holds(trip_id, status, expires_at);
