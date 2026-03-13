begin;

create extension if not exists pgcrypto;

create table if not exists public.dispatch_queue (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  service_type text not null default 'taxi',
  pickup_lat double precision,
  pickup_lng double precision,
  radius_km numeric(10,2) not null default 3,
  wave integer not null default 1,
  status text not null default 'queued',
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(order_id, wave)
);

create index if not exists idx_dispatch_queue_status_created_at
on public.dispatch_queue(status, created_at);

create table if not exists public.dispatch_assignments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  driver_id uuid not null,
  score numeric(14,4) not null default 0,
  distance_km numeric(14,4),
  status text not null default 'offered',
  created_at timestamptz not null default now(),
  unique(order_id, driver_id)
);

create index if not exists idx_dispatch_assignments_order_status
on public.dispatch_assignments(order_id, status, score desc);

create or replace function public.drivers_in_dispatch_radius(
  p_lat double precision,
  p_lng double precision,
  p_radius_km numeric
)
returns table (
  driver_id uuid,
  distance_km numeric
)
language sql
stable
as $$
  select
    dp.driver_id,
    (
      6371 * acos(
        least(
          1,
          greatest(
            -1,
            cos(radians(p_lat))
            * cos(radians(dp.lat))
            * cos(radians(dp.lng) - radians(p_lng))
            + sin(radians(p_lat)) * sin(radians(dp.lat))
          )
        )
      )
    )::numeric as distance_km
  from public.driver_presence dp
  where dp.is_online = true
    and dp.lat is not null
    and dp.lng is not null
    and (
      6371 * acos(
        least(
          1,
          greatest(
            -1,
            cos(radians(p_lat))
            * cos(radians(dp.lat))
            * cos(radians(dp.lng) - radians(p_lng))
            + sin(radians(p_lat)) * sin(radians(dp.lat))
          )
        )
      )
    ) <= p_radius_km;
$$;

create or replace function public.dispatch_match_order_phase7(p_order_id uuid)
returns integer
language plpgsql
as $$
declare
  o record;
  v_inserted integer := 0;
begin
  select
    id,
    service_type,
    pickup_lat,
    pickup_lng
  into o
  from public.orders
  where id = p_order_id;

  if not found then
    raise exception 'order_not_found: %', p_order_id;
  end if;

  insert into public.dispatch_assignments (
    order_id,
    driver_id,
    score,
    distance_km,
    status
  )
  select
    o.id,
    d.driver_id,
    (1000 - d.distance_km)::numeric as score,
    d.distance_km,
    'offered'
  from public.drivers_in_dispatch_radius(o.pickup_lat, o.pickup_lng, 5) d
  where not exists (
    select 1
    from public.dispatch_assignments x
    where x.order_id = o.id
      and x.driver_id = d.driver_id
  )
  order by d.distance_km asc
  limit 10;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

create or replace function public.enqueue_dispatch_job(
  p_order_id uuid,
  p_service_type text,
  p_pickup_lat double precision,
  p_pickup_lng double precision,
  p_radius_km numeric default 3,
  p_wave integer default 1
)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  insert into public.dispatch_queue (
    order_id,
    service_type,
    pickup_lat,
    pickup_lng,
    radius_km,
    wave,
    status
  )
  values (
    p_order_id,
    coalesce(nullif(p_service_type, ''), 'taxi'),
    p_pickup_lat,
    p_pickup_lng,
    coalesce(p_radius_km, 3),
    coalesce(p_wave, 1),
    'queued'
  )
  on conflict (order_id, wave)
  do update set
    service_type = excluded.service_type,
    pickup_lat = excluded.pickup_lat,
    pickup_lng = excluded.pickup_lng,
    radius_km = excluded.radius_km,
    status = 'queued',
    updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.dispatch_match_order_phase7(uuid) is
'Phase 7 dispatch engine: online driver radius search + assignment scoring.';
comment on function public.enqueue_dispatch_job(uuid, text, double precision, double precision, numeric, integer) is
'Phase 7 queue enqueue helper for order dispatch.';

commit;
