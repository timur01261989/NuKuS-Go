-- interdistrict_trips_schema.sql
-- Adds DB schema for "Tumanlar aro" (Inter-District) trips:
-- 1) district_pitaks      (admin-managed fixed departure points)
-- 2) district_trips       (driver-created trips: PITAK or DOOR-TO-DOOR)
-- 3) district_trip_requests (client requests to driver trips)
--
-- Safe to run multiple times (IF NOT EXISTS where possible).

-- Extensions
create extension if not exists "uuid-ossp";

-- ---------------------------
-- 1) Pitak points (admin)
-- ---------------------------
create table if not exists public.district_pitaks (
  id uuid primary key default uuid_generate_v4(),
  region text not null,
  district text null,
  name text not null,
  point jsonb null, -- {lat,lng}
  note text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_district_pitaks_region on public.district_pitaks(region);
create index if not exists idx_district_pitaks_active on public.district_pitaks(is_active);

-- ---------------------------
-- 2) Driver trips
-- ---------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'district_trip_mode') then
    create type public.district_trip_mode as enum ('pitak', 'door');
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'district_trip_status') then
    create type public.district_trip_status as enum ('open', 'closed', 'canceled');
  end if;
end$$;

create table if not exists public.district_trips (
  id uuid primary key default uuid_generate_v4(),
  driver_id uuid not null, -- auth.users.id
  mode public.district_trip_mode not null default 'pitak',

  region text not null,
  from_district text not null,
  to_district text not null,

  -- PITAK: optional pitak point reference
  pitak_id uuid null references public.district_pitaks(id) on delete set null,

  -- DOOR: addresses/points can be stored by driver (route template) or client request
  pickup_address text null,
  pickup_point jsonb null,   -- {lat,lng}
  dropoff_address text null,
  dropoff_point jsonb null,  -- {lat,lng}

  depart_at timestamptz not null,
  seats_total int not null default 4,
  seats_available int not null default 4,

  -- Pricing
  base_price_uzs numeric not null default 0,
  pickup_fee_uzs numeric not null default 0,
  dropoff_fee_uzs numeric not null default 0,
  full_salon_price_uzs numeric not null default 0,
  allow_full_salon boolean not null default false,

  -- Features/filters
  has_ac boolean not null default false,
  has_trunk boolean not null default false,
  is_lux boolean not null default false,
  allow_smoking boolean not null default false,

  -- Delivery add-on (Eltish)
  has_delivery boolean not null default false,
  delivery_price_uzs numeric not null default 0,

  notes text null,
  status public.district_trip_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_district_trips_region on public.district_trips(region);
create index if not exists idx_district_trips_route on public.district_trips(from_district, to_district);
create index if not exists idx_district_trips_depart on public.district_trips(depart_at);
create index if not exists idx_district_trips_status on public.district_trips(status);
create index if not exists idx_district_trips_driver on public.district_trips(driver_id);

-- ---------------------------
-- 3) Client requests to trips
-- ---------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'district_trip_request_status') then
    create type public.district_trip_request_status as enum ('sent', 'accepted', 'declined', 'canceled');
  end if;
end$$;

create table if not exists public.district_trip_requests (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references public.district_trips(id) on delete cascade,
  client_id uuid null, -- auth.users.id (nullable for guest flows)
  client_name text null,
  client_phone text null,

  seats int not null default 1,
  wants_full_salon boolean not null default false,

  -- For DOOR mode: client can specify pickup/dropoff addresses (optional)
  pickup_address text null,
  pickup_point jsonb null,
  dropoff_address text null,
  dropoff_point jsonb null,

  note text null,

  status public.district_trip_request_status not null default 'sent',
  created_at timestamptz not null default now(),
  responded_at timestamptz null
);

create index if not exists idx_district_trip_requests_trip on public.district_trip_requests(trip_id);
create index if not exists idx_district_trip_requests_status on public.district_trip_requests(status);

-- ---------------------------
-- RLS (recommended)
-- ---------------------------
alter table public.district_pitaks enable row level security;
alter table public.district_trips enable row level security;
alter table public.district_trip_requests enable row level security;

-- Pitaks: read for all authenticated; write for service_role or admin (you can tighten later)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='district_pitaks' and policyname='pitaks_read') then
    create policy pitaks_read on public.district_pitaks
      for select to authenticated
      using (true);
  end if;
end$$;

-- Trips: read open trips for authenticated
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='district_trips' and policyname='trips_read') then
    create policy trips_read on public.district_trips
      for select to authenticated
      using (true);
  end if;
end$$;

-- Trips: driver can insert/update own trips
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='district_trips' and policyname='trips_driver_write') then
    create policy trips_driver_write on public.district_trips
      for insert to authenticated
      with check (auth.uid() = driver_id);
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='district_trips' and policyname='trips_driver_update') then
    create policy trips_driver_update on public.district_trips
      for update to authenticated
      using (auth.uid() = driver_id)
      with check (auth.uid() = driver_id);
  end if;
end$$;

-- Requests: authenticated client can insert
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='district_trip_requests' and policyname='req_insert') then
    create policy req_insert on public.district_trip_requests
      for insert to authenticated
      with check (true);
  end if;
end$$;

-- Requests: driver can read requests for their trips (via EXISTS)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='district_trip_requests' and policyname='req_driver_read') then
    create policy req_driver_read on public.district_trip_requests
      for select to authenticated
      using (
        exists (
          select 1 from public.district_trips t
          where t.id = district_trip_requests.trip_id
            and t.driver_id = auth.uid()
        )
      );
  end if;
end$$;

-- Requests: driver can update status (accept/decline) for their trips
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='district_trip_requests' and policyname='req_driver_update') then
    create policy req_driver_update on public.district_trip_requests
      for update to authenticated
      using (
        exists (
          select 1 from public.district_trips t
          where t.id = district_trip_requests.trip_id
            and t.driver_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from public.district_trips t
          where t.id = district_trip_requests.trip_id
            and t.driver_id = auth.uid()
        )
      );
  end if;
end$$;

-- Optional: allow client to read their own requests
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='district_trip_requests' and policyname='req_client_read') then
    create policy req_client_read on public.district_trip_requests
      for select to authenticated
      using (client_id = auth.uid());
  end if;
end$$;
