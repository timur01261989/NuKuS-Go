-- UniGo cleaned SQL patch for prior 25/26 migrations
-- Purpose:
-- 1) Remove unsafe legacy migration assumptions like client_id columns that do not exist
-- 2) Normalize vehicles.user_id to auth.users(id)
-- 3) Add driver service settings and vehicle change request support
-- 4) Add active_vehicle_id on profiles
-- 5) Keep everything additive and idempotent where possible

begin;

create extension if not exists pgcrypto;

-- =========================================================
-- 1. SAFETY: vehicles.user_id must reference auth.users(id)
--    not profiles(id), otherwise inserts fail when profile row is missing
-- =========================================================
alter table public.vehicles
  add column if not exists user_id uuid;

-- Backfill from legacy driver_id if present and user_id is empty
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'vehicles'
      AND column_name = 'driver_id'
  ) THEN
    EXECUTE '
      update public.vehicles
      set user_id = coalesce(user_id, driver_id)
      where user_id is null and driver_id is not null
    ';
  END IF;
END $$;

alter table public.vehicles
  drop constraint if exists vehicles_user_id_fkey;

alter table public.vehicles
  add constraint vehicles_user_id_fkey
  foreign key (user_id)
  references auth.users(id)
  on delete cascade;

create index if not exists vehicles_user_id_idx
  on public.vehicles(user_id);

-- =========================================================
-- 2. PROFILES: active_vehicle_id for current selected vehicle
-- =========================================================
alter table public.profiles
  add column if not exists active_vehicle_id uuid;

alter table public.profiles
  drop constraint if exists profiles_active_vehicle_id_fkey;

alter table public.profiles
  add constraint profiles_active_vehicle_id_fkey
  foreign key (active_vehicle_id)
  references public.vehicles(id)
  on delete set null;

create index if not exists profiles_active_vehicle_id_idx
  on public.profiles(active_vehicle_id);

-- =========================================================
-- 3. driver_applications extra fields for registration step1/step2
-- =========================================================
alter table public.driver_applications
  add column if not exists requested_vehicle_type text;

alter table public.driver_applications
  add column if not exists requested_service_types jsonb default '{}'::jsonb;

-- Optional physical characteristics if you want to preserve them in application row too
alter table public.driver_applications
  add column if not exists requested_max_weight_kg numeric;

alter table public.driver_applications
  add column if not exists requested_max_volume_m3 numeric;

-- =========================================================
-- 4. vehicles extra fields for unified vehicle model
-- =========================================================
alter table public.vehicles
  add column if not exists vehicle_type text;

alter table public.vehicles
  add column if not exists plate_number text;

alter table public.vehicles
  add column if not exists seat_count integer;

alter table public.vehicles
  add column if not exists max_weight_kg numeric;

alter table public.vehicles
  add column if not exists max_volume_m3 numeric;

alter table public.vehicles
  add column if not exists approval_status text default 'approved';

alter table public.vehicles
  add column if not exists is_active boolean default false;

alter table public.vehicles
  add column if not exists year integer;

alter table public.vehicles
  add column if not exists note text;

create index if not exists vehicles_is_active_idx
  on public.vehicles(user_id, is_active);

-- =========================================================
-- 5. driver_service_settings table (user_id based)
-- =========================================================
create table if not exists public.driver_service_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,

  city_passenger boolean not null default false,
  city_delivery boolean not null default false,
  city_freight boolean not null default false,

  intercity_passenger boolean not null default false,
  intercity_delivery boolean not null default false,
  intercity_freight boolean not null default false,

  interdistrict_passenger boolean not null default false,
  interdistrict_delivery boolean not null default false,
  interdistrict_freight boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists driver_service_settings_user_id_idx
  on public.driver_service_settings(user_id);

-- Backfill from driver_applications.requested_service_types when possible
insert into public.driver_service_settings (
  user_id,
  city_passenger,
  city_delivery,
  city_freight,
  intercity_passenger,
  intercity_delivery,
  intercity_freight,
  interdistrict_passenger,
  interdistrict_delivery,
  interdistrict_freight
)
select
  da.user_id,
  coalesce((da.requested_service_types -> 'city' ->> 'passenger')::boolean, false),
  coalesce((da.requested_service_types -> 'city' ->> 'delivery')::boolean, false),
  coalesce((da.requested_service_types -> 'city' ->> 'freight')::boolean, false),
  coalesce((da.requested_service_types -> 'intercity' ->> 'passenger')::boolean, false),
  coalesce((da.requested_service_types -> 'intercity' ->> 'delivery')::boolean, false),
  coalesce((da.requested_service_types -> 'intercity' ->> 'freight')::boolean, false),
  coalesce((da.requested_service_types -> 'interdistrict' ->> 'passenger')::boolean, false),
  coalesce((da.requested_service_types -> 'interdistrict' ->> 'delivery')::boolean, false),
  coalesce((da.requested_service_types -> 'interdistrict' ->> 'freight')::boolean, false)
from public.driver_applications da
where da.user_id is not null
on conflict (user_id) do nothing;

-- =========================================================
-- 6. vehicle_change_requests table
-- =========================================================
create table if not exists public.vehicle_change_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid null references public.vehicles(id) on delete set null,
  request_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vehicle_change_requests_user_id_idx
  on public.vehicle_change_requests(user_id);

create index if not exists vehicle_change_requests_vehicle_id_idx
  on public.vehicle_change_requests(vehicle_id);

-- =========================================================
-- 7. Keep exactly one active vehicle per user when possible
-- =========================================================
-- If profiles.active_vehicle_id is null but user has an active vehicle, backfill it.
update public.profiles p
set active_vehicle_id = v.id
from (
  select distinct on (user_id) user_id, id
  from public.vehicles
  where user_id is not null and coalesce(is_active, false) = true
  order by user_id, id
) v
where p.id = v.user_id
  and p.active_vehicle_id is null;

-- If no active vehicle exists but user has vehicles, pick the first approved one.
update public.profiles p
set active_vehicle_id = v.id
from (
  select distinct on (user_id) user_id, id
  from public.vehicles
  where user_id is not null
    and coalesce(approval_status, 'approved') in ('approved', 'active')
  order by user_id, is_active desc, id
) v
where p.id = v.user_id
  and p.active_vehicle_id is null;

-- Sync vehicles.is_active with profiles.active_vehicle_id
update public.vehicles v
set is_active = case when p.active_vehicle_id = v.id then true else false end
from public.profiles p
where p.id = v.user_id;

-- =========================================================
-- 8. updated_at triggers
-- =========================================================
create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_driver_service_settings_updated_at on public.driver_service_settings;
create trigger set_driver_service_settings_updated_at
before update on public.driver_service_settings
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_vehicle_change_requests_updated_at on public.vehicle_change_requests;
create trigger set_vehicle_change_requests_updated_at
before update on public.vehicle_change_requests
for each row
execute function public.set_current_timestamp_updated_at();

-- =========================================================
-- 9. RLS
-- =========================================================
alter table public.driver_service_settings enable row level security;
alter table public.vehicle_change_requests enable row level security;

-- driver_service_settings policies
DROP POLICY IF EXISTS driver_service_settings_select_own ON public.driver_service_settings;
CREATE POLICY driver_service_settings_select_own
ON public.driver_service_settings
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS driver_service_settings_insert_own ON public.driver_service_settings;
CREATE POLICY driver_service_settings_insert_own
ON public.driver_service_settings
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS driver_service_settings_update_own ON public.driver_service_settings;
CREATE POLICY driver_service_settings_update_own
ON public.driver_service_settings
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- vehicle_change_requests policies
DROP POLICY IF EXISTS vehicle_change_requests_select_own ON public.vehicle_change_requests;
CREATE POLICY vehicle_change_requests_select_own
ON public.vehicle_change_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS vehicle_change_requests_insert_own ON public.vehicle_change_requests;
CREATE POLICY vehicle_change_requests_insert_own
ON public.vehicle_change_requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS vehicle_change_requests_update_own ON public.vehicle_change_requests;
CREATE POLICY vehicle_change_requests_update_own
ON public.vehicle_change_requests
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =========================================================
-- 10. IMPORTANT: DO NOT run unsafe legacy migrations that assume columns like client_id
--     Example skipped intentionally:
--     update public.inter_prov_seat_requests
--     set user_id = coalesce(user_id, client_id)
--     where user_id is null and client_id is not null;
-- =========================================================

commit;
