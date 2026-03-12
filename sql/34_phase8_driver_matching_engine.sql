-- UniGo 8-bosqich: yagona driver order matching engine
begin;

create or replace function public.resolve_matching_service_scope(
  p_service_type text,
  p_service_scope text default null
)
returns text
language plpgsql
immutable
as $$
declare
  v_service_type text := lower(coalesce(p_service_type, 'taxi'));
  v_service_scope text := lower(coalesce(nullif(p_service_scope, ''), ''));
begin
  if v_service_scope in ('city', 'intercity', 'interdistrict') then
    return v_service_scope;
  end if;

  if v_service_type in ('inter_city', 'intercity') then
    return 'intercity';
  end if;

  if v_service_type in ('inter_district', 'interdistrict') then
    return 'interdistrict';
  end if;

  return 'city';
end;
$$;

create or replace function public.resolve_matching_order_type(p_service_type text)
returns text
language plpgsql
immutable
as $$
declare
  v_service_type text := lower(coalesce(p_service_type, 'taxi'));
begin
  if v_service_type = 'delivery' then
    return 'delivery';
  end if;
  if v_service_type = 'freight' then
    return 'freight';
  end if;
  return 'passenger';
end;
$$;

create or replace function public.match_order_candidates(
  p_pickup_lat double precision,
  p_pickup_lng double precision,
  p_service_type text,
  p_service_scope text default null,
  p_passenger_count integer default 1,
  p_cargo_weight_kg numeric default 0,
  p_cargo_volume_m3 numeric default 0,
  p_radius_km numeric default 6,
  p_limit integer default 20,
  p_excluded_driver_ids uuid[] default '{}'::uuid[]
)
returns table (
  driver_id uuid,
  dist_km numeric,
  freshness_minutes numeric,
  capability_score numeric,
  dispatch_score numeric,
  active_service_type text,
  vehicle_id uuid,
  vehicle_type text,
  seat_count integer,
  max_weight_kg numeric,
  max_volume_m3 numeric,
  match_scope text,
  matched_order_type text,
  last_seen_at timestamptz
)
language sql
stable
as $$
with order_ctx as (
  select
    public.resolve_matching_service_scope(p_service_type, p_service_scope) as service_scope,
    public.resolve_matching_order_type(p_service_type) as order_type,
    greatest(coalesce(p_passenger_count, 1), 1) as passenger_count,
    greatest(coalesce(p_cargo_weight_kg, 0), 0) as cargo_weight_kg,
    greatest(coalesce(p_cargo_volume_m3, 0), 0) as cargo_volume_m3,
    greatest(coalesce(p_radius_km, 6), 0.2) as radius_km,
    greatest(least(coalesce(p_limit, 20), 100), 1) as candidate_limit,
    now() as now_ts
), approved_applications as (
  select distinct on (da.user_id)
    da.user_id,
    lower(coalesce(da.status, 'pending')) as status,
    da.created_at
  from public.driver_applications da
  order by da.user_id, da.created_at desc
), active_vehicles as (
  select distinct on (coalesce(v.user_id, v.driver_id))
    coalesce(v.user_id, v.driver_id) as user_id,
    v.id,
    coalesce(nullif(v.vehicle_type, ''), nullif(v.requested_vehicle_type, ''), nullif(v.transport_type, ''), nullif(v.body_type, ''), 'light_car') as vehicle_type,
    greatest(coalesce(v.seat_count, v.seats, 0), 0)::integer as seat_count,
    greatest(coalesce(v.max_weight_kg, v.capacity_kg, v.requested_max_freight_weight_kg, 0), 0) as max_weight_kg,
    greatest(coalesce(v.max_volume_m3, v.capacity_m3, v.requested_payload_volume_m3, 0), 0) as max_volume_m3,
    lower(coalesce(nullif(v.approval_status, ''), nullif(v.status, ''), 'approved')) as approval_status,
    coalesce(v.is_active, false) as is_active,
    v.updated_at,
    v.created_at
  from public.vehicles v
  order by coalesce(v.user_id, v.driver_id), coalesce(v.is_active, false) desc, v.updated_at desc nulls last, v.created_at desc nulls last
), base as (
  select
    dp.driver_id,
    dp.active_service_type,
    dp.last_seen_at,
    dss.city_passenger,
    dss.city_delivery,
    dss.city_freight,
    dss.intercity_passenger,
    dss.intercity_delivery,
    dss.intercity_freight,
    dss.interdistrict_passenger,
    dss.interdistrict_delivery,
    dss.interdistrict_freight,
    av.id as vehicle_id,
    av.vehicle_type,
    av.seat_count,
    av.max_weight_kg,
    av.max_volume_m3,
    av.is_active as vehicle_is_active,
    av.approval_status,
    (
      6371 * acos(
        least(
          1,
          greatest(
            -1,
            cos(radians(p_pickup_lat)) * cos(radians(dp.lat)) * cos(radians(dp.lng) - radians(p_pickup_lng)) +
            sin(radians(p_pickup_lat)) * sin(radians(dp.lat))
          )
        )
      )
    )::numeric as dist_km,
    extract(epoch from ((select now_ts from order_ctx) - coalesce(dp.last_seen_at, dp.updated_at, (select now_ts from order_ctx)))) / 60.0 as freshness_minutes,
    (select service_scope from order_ctx) as match_scope,
    (select order_type from order_ctx) as matched_order_type
  from public.driver_presence dp
  join approved_applications aa
    on aa.user_id = dp.driver_id
   and aa.status = 'approved'
  join public.driver_service_settings dss
    on dss.user_id = dp.driver_id
  join active_vehicles av
    on av.user_id = dp.driver_id
  where dp.is_online = true
    and dp.state in ('online', 'paused')
    and dp.current_order_id is null
    and dp.lat is not null
    and dp.lng is not null
    and av.approval_status = 'approved'
    and not (dp.driver_id = any(coalesce(p_excluded_driver_ids, '{}'::uuid[])))
), filtered as (
  select
    b.*,
    case
      when b.match_scope = 'city' and b.matched_order_type = 'passenger' then b.city_passenger
      when b.match_scope = 'city' and b.matched_order_type = 'delivery' then b.city_delivery
      when b.match_scope = 'city' and b.matched_order_type = 'freight' then b.city_freight
      when b.match_scope = 'intercity' and b.matched_order_type = 'passenger' then b.intercity_passenger
      when b.match_scope = 'intercity' and b.matched_order_type = 'delivery' then b.intercity_delivery
      when b.match_scope = 'intercity' and b.matched_order_type = 'freight' then b.intercity_freight
      when b.match_scope = 'interdistrict' and b.matched_order_type = 'passenger' then b.interdistrict_passenger
      when b.match_scope = 'interdistrict' and b.matched_order_type = 'delivery' then b.interdistrict_delivery
      when b.match_scope = 'interdistrict' and b.matched_order_type = 'freight' then b.interdistrict_freight
      else false
    end as service_enabled,
    case
      when b.matched_order_type = 'passenger' then greatest((select passenger_count from order_ctx), 1) <= greatest(b.seat_count, 1)
      when b.matched_order_type = 'delivery' then
        ((select cargo_weight_kg from order_ctx) = 0 or b.max_weight_kg = 0 or (select cargo_weight_kg from order_ctx) <= b.max_weight_kg)
        and ((select cargo_volume_m3 from order_ctx) = 0 or b.max_volume_m3 = 0 or (select cargo_volume_m3 from order_ctx) <= b.max_volume_m3)
      when b.matched_order_type = 'freight' then
        (b.max_weight_kg > 0 or b.max_volume_m3 > 0)
        and ((select cargo_weight_kg from order_ctx) = 0 or (select cargo_weight_kg from order_ctx) <= b.max_weight_kg)
        and ((select cargo_volume_m3 from order_ctx) = 0 or (select cargo_volume_m3 from order_ctx) <= b.max_volume_m3)
      else false
    end as capacity_ok
  from base b
  where b.dist_km <= (select radius_km from order_ctx)
    and b.freshness_minutes <= 5
), scored as (
  select
    f.driver_id,
    round(f.dist_km::numeric, 4) as dist_km,
    round(f.freshness_minutes::numeric, 4) as freshness_minutes,
    (
      case when f.vehicle_is_active then 12 else 8 end +
      case when lower(coalesce(f.active_service_type, '')) = lower(coalesce(p_service_type, '')) then 8 else 2 end
    )::numeric as capability_score,
    (
      greatest(0, 60 - (f.dist_km * 10)) +
      greatest(0, 20 - f.freshness_minutes) +
      case when f.vehicle_is_active then 12 else 8 end +
      case when lower(coalesce(f.active_service_type, '')) = lower(coalesce(p_service_type, '')) then 8 else 2 end
    )::numeric as dispatch_score,
    f.active_service_type,
    f.vehicle_id,
    f.vehicle_type,
    f.seat_count,
    f.max_weight_kg,
    f.max_volume_m3,
    f.match_scope,
    f.matched_order_type,
    f.last_seen_at
  from filtered f
  where f.service_enabled = true
    and f.capacity_ok = true
)
select
  s.driver_id,
  s.dist_km,
  s.freshness_minutes,
  s.capability_score,
  s.dispatch_score,
  s.active_service_type,
  s.vehicle_id,
  s.vehicle_type,
  s.seat_count,
  s.max_weight_kg,
  s.max_volume_m3,
  s.match_scope,
  s.matched_order_type,
  s.last_seen_at
from scored s
order by s.dispatch_score desc, s.dist_km asc, s.last_seen_at desc nulls last
limit (select candidate_limit from order_ctx);
$$;

create or replace function public.dispatch_match_order(
  p_order_id uuid,
  p_limit integer default 20,
  p_radius_km numeric default 6,
  p_excluded_driver_ids uuid[] default '{}'::uuid[]
)
returns table (
  driver_id uuid,
  dist_km numeric,
  freshness_minutes numeric,
  capability_score numeric,
  dispatch_score numeric,
  active_service_type text,
  vehicle_id uuid,
  vehicle_type text,
  seat_count integer,
  max_weight_kg numeric,
  max_volume_m3 numeric,
  match_scope text,
  matched_order_type text,
  last_seen_at timestamptz
)
language sql
stable
as $$
select *
from public.match_order_candidates(
  p_pickup_lat => coalesce((o.pickup ->> 'lat')::double precision, (o.from_location ->> 'lat')::double precision),
  p_pickup_lng => coalesce((o.pickup ->> 'lng')::double precision, (o.from_location ->> 'lng')::double precision),
  p_service_type => o.service_type,
  p_service_scope => coalesce(o.route_meta ->> 'service_scope', o.route_meta ->> 'service_area', o.route_meta ->> 'service_mode'),
  p_passenger_count => coalesce(o.passenger_count, 1),
  p_cargo_weight_kg => coalesce(o.cargo_weight_kg, 0),
  p_cargo_volume_m3 => coalesce(o.cargo_volume_m3, 0),
  p_radius_km => p_radius_km,
  p_limit => p_limit,
  p_excluded_driver_ids => p_excluded_driver_ids
)
from public.orders o
where o.id = p_order_id
  and o.status in ('searching', 'offered', 'pending');
$$;

comment on function public.match_order_candidates(double precision, double precision, text, text, integer, numeric, numeric, numeric, integer, uuid[]) is 'Phase 8 canonical driver matching engine based on driver_presence + driver_service_settings + vehicles';
comment on function public.dispatch_match_order(uuid, integer, numeric, uuid[]) is 'Phase 8 helper to resolve matching candidates directly from orders';

commit;
