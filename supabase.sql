-- NUKUS TAXI: single-file schema + indexes + dispatch helper (10k online drivers ready)
-- Run in Supabase SQL Editor.

-- Extensions
create extension if not exists pgcrypto;

-- PROFILES (all users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('client','driver','admin')) default 'client',
  full_name text,
  phone text,
  created_at timestamptz default now()
);

-- DRIVER APPLICATIONS (approval)
create table if not exists public.driver_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending','approved','rejected')) default 'pending',
  created_at timestamptz default now()
);

create index if not exists idx_driver_applications_user_id on public.driver_applications(user_id);
create index if not exists idx_driver_applications_status on public.driver_applications(status);

-- DRIVER PRESENCE (online drivers)
create table if not exists public.driver_presence (
  driver_id uuid primary key references public.profiles(id) on delete cascade,
  -- Backward-compatibility column (older code used driver_user_id):
  driver_user_id uuid,
  is_online boolean default false,
  state text,
  lat double precision,
  lng double precision,
  heading double precision,
  speed double precision,
  accuracy double precision,
  last_seen_at timestamptz,
  updated_at timestamptz default now()
);

-- Keep driver_user_id in sync if null
create or replace function public.sync_driver_presence_ids()
returns trigger
language plpgsql
as $$
begin
  if new.driver_user_id is null then
    new.driver_user_id := new.driver_id;
  end if;
  if new.last_seen_at is null then
    new.last_seen_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_sync_driver_presence_ids on public.driver_presence;
create trigger trg_sync_driver_presence_ids
before insert or update on public.driver_presence
for each row execute function public.sync_driver_presence_ids();

create index if not exists idx_driver_presence_online_updated on public.driver_presence(is_online, updated_at desc);
create index if not exists idx_driver_presence_lat on public.driver_presence(lat);
create index if not exists idx_driver_presence_lng on public.driver_presence(lng);

-- ORDERS
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  passenger_id uuid references public.profiles(id) on delete set null,
  driver_id uuid references public.profiles(id) on delete set null,
  pickup jsonb,
  dropoff jsonb,
  status text not null default 'searching',
  price numeric,
  created_at timestamptz default now(),
  accepted_at timestamptz
);

create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_driver_id on public.orders(driver_id);
create index if not exists idx_orders_passenger_id on public.orders(passenger_id);

-- OFFERS (queue)
create table if not exists public.order_offers (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  driver_id uuid not null references public.profiles(id) on delete cascade,
  -- Backward-compatibility (older code used driver_user_id)
  driver_user_id uuid,
  status text not null check (status in ('sent','accepted','rejected','expired')) default 'sent',
  sent_at timestamptz default now(),
  expires_at timestamptz,
  responded_at timestamptz
);

create unique index if not exists uq_order_offers_order_driver on public.order_offers(order_id, driver_id);
create index if not exists idx_order_offers_order_status on public.order_offers(order_id, status);
create index if not exists idx_order_offers_driver_status on public.order_offers(driver_id, status);

create or replace function public.sync_order_offers_ids()
returns trigger
language plpgsql
as $$
begin
  if new.driver_user_id is null then
    new.driver_user_id := new.driver_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_order_offers_ids on public.order_offers;
create trigger trg_sync_order_offers_ids
before insert or update on public.order_offers
for each row execute function public.sync_order_offers_ids();

-- Helper: DB-side nearest-driver selection (no PostGIS required)
-- Uses bounding box + haversine ordering.
create or replace function public.find_nearby_drivers(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision,
  p_limit integer,
  p_exclude_driver_ids uuid[] default '{}'
)
returns table (
  driver_id uuid,
  lat double precision,
  lng double precision,
  dist_km double precision
)
language sql
stable
as $$
  with params as (
    select
      p_lat as lat0,
      p_lng as lng0,
      greatest(p_radius_km, 0.1) as rkm,
      -- rough degree deltas
      (p_radius_km / 111.0) as dlat,
      (p_radius_km / (111.0 * greatest(cos(radians(p_lat)), 0.2))) as dlng
  ),
  fresh as (
    select dp.driver_id, dp.lat, dp.lng
    from public.driver_presence dp
    join public.driver_applications da
      on da.user_id = dp.driver_id and da.status = 'approved'
    cross join params p
    where dp.is_online = true
      and dp.updated_at >= now() - interval '25 seconds'
      and dp.lat is not null and dp.lng is not null
      and dp.lat between (p.lat0 - p.dlat) and (p.lat0 + p.dlat)
      and dp.lng between (p.lng0 - p.dlng) and (p.lng0 + p.dlng)
      and (coalesce(p_exclude_driver_ids, '{}') = '{}'::uuid[] or dp.driver_id <> all(p_exclude_driver_ids))
  )
  select
    f.driver_id,
    f.lat,
    f.lng,
    (6371.0 * 2.0 * asin(
      sqrt(
        pow(sin(radians((f.lat - p.lat0) / 2.0)), 2)
        + cos(radians(p.lat0)) * cos(radians(f.lat))
        * pow(sin(radians((f.lng - p.lng0) / 2.0)), 2)
      )
    )) as dist_km
  from fresh f
  cross join params p
  where (6371.0 * 2.0 * asin(
      sqrt(
        pow(sin(radians((f.lat - p.lat0) / 2.0)), 2)
        + cos(radians(p.lat0)) * cos(radians(f.lat))
        * pow(sin(radians((f.lng - p.lng0) / 2.0)), 2)
      )
    )) <= p.rkm
  order by dist_km asc
  limit greatest(p_limit, 1);
$$;

-- Basic RLS (server uses service_role; clients should not have broad write access)
alter table public.profiles enable row level security;
alter table public.driver_applications enable row level security;
alter table public.driver_presence enable row level security;
alter table public.orders enable row level security;
alter table public.order_offers enable row level security;

-- profiles: users can read/update their own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select to authenticated
using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- driver_applications: user can insert/select their own; admin/server handles approval via service role
drop policy if exists "driver_applications_own" on public.driver_applications;
create policy "driver_applications_own" on public.driver_applications
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "driver_applications_insert_own" on public.driver_applications;
create policy "driver_applications_insert_own" on public.driver_applications
for insert to authenticated
with check (user_id = auth.uid());

-- driver_presence: driver can upsert their own; authenticated can read online drivers (map) if needed
drop policy if exists "driver_presence_select_online" on public.driver_presence;
create policy "driver_presence_select_online" on public.driver_presence
for select to authenticated
using (is_online = true);

drop policy if exists "driver_presence_upsert_own" on public.driver_presence;
create policy "driver_presence_upsert_own" on public.driver_presence
for insert to authenticated
with check (driver_id = auth.uid());

drop policy if exists "driver_presence_update_own" on public.driver_presence;
create policy "driver_presence_update_own" on public.driver_presence
for update to authenticated
using (driver_id = auth.uid())
with check (driver_id = auth.uid());

-- orders: passenger can create/see own; driver can see assigned
drop policy if exists "orders_insert_passenger" on public.orders;
create policy "orders_insert_passenger" on public.orders
for insert to authenticated
with check (passenger_id = auth.uid());

drop policy if exists "orders_select_own_or_assigned" on public.orders;
create policy "orders_select_own_or_assigned" on public.orders
for select to authenticated
using (passenger_id = auth.uid() or driver_id = auth.uid());

-- order_offers: driver can read offers sent to them
drop policy if exists "order_offers_select_driver" on public.order_offers;
create policy "order_offers_select_driver" on public.order_offers
for select to authenticated
using (driver_id = auth.uid() or driver_user_id = auth.uid());


-- ============================================================
-- Idempotent schema fixes (safe to re-run)
-- Ensures columns exist even if tables were created earlier
-- ============================================================

-- orders: ensure expected columns exist
alter table if exists public.orders
  add column if not exists passenger_id uuid,
  add column if not exists driver_id uuid,
  add column if not exists pickup jsonb,
  add column if not exists dropoff jsonb,
  add column if not exists price numeric,
  add column if not exists status text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists accepted_at timestamptz;

-- driver_presence: ensure expected columns exist
alter table if exists public.driver_presence
  add column if not exists driver_id uuid,
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists is_online boolean default false,
  add column if not exists updated_at timestamptz default now();

-- drivers: compatibility table used by UI (driver dashboard)
create table if not exists public.drivers (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  is_online boolean not null default false,
  lat double precision,
  lng double precision,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.drivers enable row level security;

-- ============================================================
-- RLS POLICY FIXES
-- ============================================================

-- PROFILES: allow users to read their own profile + allow everyone authenticated to read driver profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_select_drivers_public" on public.profiles;
create policy "profiles_select_drivers_public"
on public.profiles for select
to authenticated
using (role = 'driver');

-- DRIVER_PRESENCE: allow passengers to see online drivers (read-only)
drop policy if exists "driver_presence_select_own" on public.driver_presence;
create policy "driver_presence_select_own"
on public.driver_presence for select
to authenticated
using (driver_id = auth.uid());

drop policy if exists "driver_presence_select_online" on public.driver_presence;
create policy "driver_presence_select_online"
on public.driver_presence for select
to authenticated
using (is_online = true);

-- DRIVERS: driver can read/update own row; passengers can read online drivers
drop policy if exists "drivers_select_own" on public.drivers;
create policy "drivers_select_own"
on public.drivers for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "drivers_upsert_own" on public.drivers;
create policy "drivers_upsert_own"
on public.drivers for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "drivers_update_own" on public.drivers;
create policy "drivers_update_own"
on public.drivers for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "drivers_select_online" on public.drivers;
create policy "drivers_select_online"
on public.drivers for select
to authenticated
using (is_online = true);

-- ORDERS: keep strict: passenger sees own orders; driver sees assigned orders
drop policy if exists "orders_select_own_or_assigned" on public.orders;
create policy "orders_select_own_or_assigned"
on public.orders for select
to authenticated
using (passenger_id = auth.uid() or driver_id = auth.uid());

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own"
on public.orders for insert
to authenticated
with check (passenger_id = auth.uid());

drop policy if exists "orders_update_passenger_or_driver" on public.orders;
create policy "orders_update_passenger_or_driver"
on public.orders for update
to authenticated
using (passenger_id = auth.uid() or driver_id = auth.uid())
with check (passenger_id = auth.uid() or driver_id = auth.uid());


-- drivers: ensure last_seen_at exists
alter table if exists public.drivers add column if not exists last_seen_at timestamptz default now();



-- ------------------------------------------------------------
-- GRANTS (IMPORTANT)
-- If you create tables via SQL, PostgREST needs explicit privileges.
-- Without these GRANTs you will see 401/403 in the browser (Forbidden).
-- ------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

grant usage, select, update on all sequences in schema public to authenticated;
grant usage, select on all sequences in schema public to anon;

alter default privileges in schema public
grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
grant select on tables to anon;

alter default privileges in schema public
grant usage, select, update on sequences to authenticated;

alter default privileges in schema public
grant usage, select on sequences to anon;



-- ===========================
-- UniGo: SERVICE-BASED PRESENCE (per-service Online)
-- ===========================

-- Add service_type to orders (required for dispatch filtering)
alter table public.orders
  add column if not exists service_type text default 'taxi';

create index if not exists idx_orders_service_type on public.orders(service_type);

-- Per-service driver presence (online + last seen + location)
create table if not exists public.driver_service_presence (
  driver_id uuid not null references public.profiles(id) on delete cascade,
  service_type text not null,
  is_online boolean not null default false,
  lat double precision,
  lng double precision,
  last_seen_at timestamptz default now(),
  primary key (driver_id, service_type)
);

create index if not exists idx_driver_service_presence_online on public.driver_service_presence(service_type, is_online);
create index if not exists idx_driver_service_presence_last_seen on public.driver_service_presence(last_seen_at);

-- Find nearby drivers for a specific service (Uber/Yandex-style filtering)
create or replace function public.find_nearby_drivers_for_service(
  p_service_type text,
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision,
  p_limit integer,
  p_exclude_driver_ids uuid[] default '{}'
)
returns table (
  driver_id uuid,
  lat double precision,
  lng double precision,
  dist_km double precision
)
language sql
stable
as $$
  with params as (
    select
      p_lat as lat0,
      p_lng as lng0,
      greatest(p_radius_km, 0.1) as rkm,
      (p_radius_km / 111.0) as dlat,
      (p_radius_km / (111.0 * greatest(cos(radians(p_lat)), 0.2))) as dlng
  ),
  fresh as (
    select dsp.driver_id, dsp.lat, dsp.lng
    from public.driver_service_presence dsp
    join public.driver_applications da
      on da.user_id = dsp.driver_id and da.status = 'approved'
    cross join params p
    where dsp.service_type = p_service_type
      and dsp.is_online = true
      and dsp.lat is not null and dsp.lng is not null
      and dsp.last_seen_at > now() - interval '45 seconds'
      and dsp.lat between (p.lat0 - p.dlat) and (p.lat0 + p.dlat)
      and dsp.lng between (p.lng0 - p.dlng) and (p.lng0 + p.dlng)
      and not (dsp.driver_id = any(p_exclude_driver_ids))
  )
  select
    f.driver_id,
    f.lat,
    f.lng,
    public.haversine_km(p_lat, p_lng, f.lat, f.lng) as dist_km
  from fresh f
  where public.haversine_km(p_lat, p_lng, f.lat, f.lng) <= greatest(p_radius_km, 0.1)
  order by dist_km asc
  limit greatest(p_limit, 1);
$$;

