create table if not exists public.fleets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  title text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.fleet_drivers (
  id uuid primary key default gen_random_uuid(),
  fleet_id uuid not null references public.fleets(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'driver',
  created_at timestamptz not null default now()
);
create table if not exists public.fleet_vehicles (
  id uuid primary key default gen_random_uuid(),
  fleet_id uuid not null references public.fleets(id) on delete cascade,
  vehicle_id uuid null,
  plate_number text null,
  title text null,
  created_at timestamptz not null default now()
);
