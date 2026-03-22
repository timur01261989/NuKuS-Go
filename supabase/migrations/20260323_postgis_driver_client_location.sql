-- =============================================================================
-- PostGIS: haydovchi (driver_presence) va mijoz (client_last_location)
-- GiST indekslar, lat/lng → geography sinxron trigger, aniq ustunli RPC
-- =============================================================================
begin;

create extension if not exists postgis;

-- ---------------------------------------------------------------------------
-- 1) driver_presence: geography(Point,4326) + GiST
-- ---------------------------------------------------------------------------
alter table public.driver_presence
  add column if not exists location geography(Point, 4326);

update public.driver_presence
set location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
where lat is not null
  and lng is not null
  and (location is null);

drop index if exists public.idx_driver_presence_location_gist;

create index if not exists idx_driver_presence_location_gist
  on public.driver_presence
  using gist (location);

create index if not exists idx_driver_presence_online_seen_service
  on public.driver_presence (is_online, last_seen_at desc, active_service_type)
  where is_online = true;

create or replace function public.driver_presence_sync_location()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.lat is not null and new.lng is not null
     and new.lat between -90::double precision and 90::double precision
     and new.lng between -180::double precision and 180::double precision then
    new.location := ST_SetSRID(ST_MakePoint(new.lng, new.lat), 4326)::geography;
  else
    new.location := null;
  end if;

  if exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'driver_presence'
      and c.column_name = 'geo_point'
  ) then
    if new.lat is not null and new.lng is not null then
      new.geo_point := point(new.lng, new.lat);
    else
      new.geo_point := null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_driver_presence_sync_location on public.driver_presence;
create trigger trg_driver_presence_sync_location
  before insert or update of lat, lng on public.driver_presence
  for each row
  execute function public.driver_presence_sync_location();

-- ---------------------------------------------------------------------------
-- 2) Mijoz oxirgi lokatsiyasi
-- ---------------------------------------------------------------------------
create table if not exists public.client_last_location (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  location geography(Point, 4326) not null,
  accuracy_m double precision,
  updated_at timestamptz not null default now()
);

create index if not exists idx_client_last_location_gist
  on public.client_last_location
  using gist (location);

create index if not exists idx_client_last_location_updated
  on public.client_last_location (updated_at desc);

create or replace function public.client_last_location_sync_location()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.lat between -90::double precision and 90::double precision
     and new.lng between -180::double precision and 180::double precision then
    new.location := ST_SetSRID(ST_MakePoint(new.lng, new.lat), 4326)::geography;
  else
    raise exception 'invalid_lat_lng' using errcode = '22023';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_client_last_location_sync on public.client_last_location;
create trigger trg_client_last_location_sync
  before insert or update of lat, lng on public.client_last_location
  for each row
  execute function public.client_last_location_sync_location();

alter table public.client_last_location enable row level security;

drop policy if exists client_last_location_select_own on public.client_last_location;
drop policy if exists client_last_location_insert_own on public.client_last_location;
drop policy if exists client_last_location_update_own on public.client_last_location;
drop policy if exists client_last_location_delete_own on public.client_last_location;

create policy client_last_location_select_own
  on public.client_last_location for select
  to authenticated
  using (user_id = auth.uid());

create policy client_last_location_insert_own
  on public.client_last_location for insert
  to authenticated
  with check (user_id = auth.uid());

create policy client_last_location_update_own
  on public.client_last_location for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy client_last_location_delete_own
  on public.client_last_location for delete
  to authenticated
  using (user_id = auth.uid());

comment on table public.client_last_location is 'Mijozning oxirgi joyi — PostGIS GiST; server/service_role orqali keng o‘qish alohida policy bilan.';

-- ---------------------------------------------------------------------------
-- 3) Radius: faqat kerakli ustunlar (havaskor select * yo‘q)
-- ---------------------------------------------------------------------------
create or replace function public.nearby_online_drivers(
  p_lng double precision,
  p_lat double precision,
  p_radius_m double precision default 2500,
  p_since timestamptz default (now() - interval '2 minutes'),
  p_service_type text default null,
  p_limit integer default 100
)
returns table (
  driver_id uuid,
  lat double precision,
  lng double precision,
  last_seen_at timestamptz,
  state text,
  active_service_type text,
  speed double precision,
  bearing double precision,
  distance_m double precision
)
language sql
stable
security definer
set search_path = public
as $$
  select
    dp.driver_id,
    dp.lat,
    dp.lng,
    dp.last_seen_at,
    dp.state,
    dp.active_service_type,
    dp.speed,
    dp.bearing,
    ST_Distance(
      dp.location,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      false
    )::double precision as distance_m
  from public.driver_presence dp
  where dp.is_online = true
    and dp.state in ('online', 'busy', 'paused')
    and dp.last_seen_at >= p_since
    and dp.location is not null
    and (p_service_type is null or btrim(p_service_type) = '' or dp.active_service_type = p_service_type)
    and ST_DWithin(
      dp.location,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      greatest(1.0::double precision, least(coalesce(p_radius_m, 2500.0::double precision), 50000.0::double precision))
    )
  order by distance_m asc nulls last
  limit least(greatest(coalesce(p_limit, 100), 1), 500);
$$;

comment on function public.nearby_online_drivers(double precision, double precision, double precision, timestamptz, text, integer)
  is 'Onlayn haydovchilar: radius + vaqt oynasi; faqat zarur ustunlar.';

revoke all on function public.nearby_online_drivers(double precision, double precision, double precision, timestamptz, text, integer) from public;
grant execute on function public.nearby_online_drivers(double precision, double precision, double precision, timestamptz, text, integer) to service_role;

-- Eski: returns setof drivers + select * — bartaraf
create or replace function public.drivers_in_radius(
  lat double precision,
  lng double precision,
  radius double precision
)
returns table (
  user_id uuid,
  last_seen timestamptz,
  dist_m double precision
)
language sql
stable
security definer
set search_path = public
as $$
  select
    d.user_id,
    d.last_seen,
    ST_Distance(
      d.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      false
    )::double precision as dist_m
  from public.drivers d
  where d.location is not null
    and coalesce(d.last_seen, now() - interval '1 hour') > now() - interval '5 minutes'
    and ST_DWithin(
      d.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      greatest(1.0::double precision, least(coalesce(radius, 2500.0::double precision), 50000.0::double precision))
    )
  order by dist_m asc
  limit 500;
$$;

revoke all on function public.drivers_in_radius(double precision, double precision, double precision) from public;
grant execute on function public.drivers_in_radius(double precision, double precision, double precision) to service_role;

commit;
