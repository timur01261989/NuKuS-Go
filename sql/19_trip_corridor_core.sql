create table if not exists public.trip_corridors (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  user_id uuid null,
  route_polyline jsonb not null default '[]'::jsonb,
  from_point jsonb null,
  to_point jsonb null,
  waypoint_points jsonb not null default '[]'::jsonb,
  max_detour_km numeric(8,2) not null default 8,
  pickup_radius_km numeric(8,2) not null default 3,
  dropoff_radius_km numeric(8,2) not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists trip_corridors_trip_id_idx on public.trip_corridors(trip_id);
