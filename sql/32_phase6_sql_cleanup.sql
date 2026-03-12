-- UniGo 6-bosqich: SQL cleanup va canonical matching foundation
begin;

create schema if not exists app_meta;

create table if not exists public.driver_service_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
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

alter table public.driver_service_settings
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists city_passenger boolean not null default false,
  add column if not exists city_delivery boolean not null default false,
  add column if not exists city_freight boolean not null default false,
  add column if not exists intercity_passenger boolean not null default false,
  add column if not exists intercity_delivery boolean not null default false,
  add column if not exists intercity_freight boolean not null default false,
  add column if not exists interdistrict_passenger boolean not null default false,
  add column if not exists interdistrict_delivery boolean not null default false,
  add column if not exists interdistrict_freight boolean not null default false,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_driver_service_settings_user_id
on public.driver_service_settings(user_id);

alter table public.vehicles
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists vehicle_type text,
  add column if not exists seat_count integer not null default 0,
  add column if not exists max_weight_kg numeric(10,2) not null default 0,
  add column if not exists max_volume_m3 numeric(10,3) not null default 0,
  add column if not exists approval_status text not null default 'pending',
  add column if not exists is_active boolean not null default false,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.vehicles
set user_id = coalesce(user_id, driver_id)
where user_id is null
  and driver_id is not null;

update public.vehicles
set vehicle_type = coalesce(nullif(vehicle_type, ''), nullif(requested_vehicle_type, ''), nullif(transport_type, ''), nullif(body_type, ''), 'light_car')
where vehicle_type is null or vehicle_type = '';

update public.vehicles
set seat_count = greatest(0, coalesce(seat_count, seats, 0))
where seat_count is null or seat_count = 0;

update public.vehicles
set max_weight_kg = greatest(0, coalesce(max_weight_kg, capacity_kg, requested_max_freight_weight_kg, 0))
where max_weight_kg is null or max_weight_kg = 0;

update public.vehicles
set max_volume_m3 = greatest(0, coalesce(max_volume_m3, capacity_m3, requested_payload_volume_m3, 0))
where max_volume_m3 is null or max_volume_m3 = 0;

update public.vehicles
set approval_status = lower(coalesce(nullif(approval_status, ''), nullif(status, ''), 'approved'))
where approval_status is null or approval_status = '';

create index if not exists idx_vehicles_matching_lookup
on public.vehicles(user_id, is_active desc, approval_status, updated_at desc);

create index if not exists idx_driver_presence_matching_lookup
on public.driver_presence(is_online, state, current_order_id, active_service_type, last_seen_at desc);

create index if not exists idx_driver_applications_matching_lookup
on public.driver_applications(user_id, status, created_at desc);

insert into public.driver_service_settings (user_id)
select p.id
from public.profiles p
left join public.driver_service_settings dss on dss.user_id = p.id
where dss.user_id is null;

create or replace view app_meta.v_driver_core_matching_snapshot as
select
  p.id as user_id,
  coalesce(da.status, 'missing') as application_status,
  dp.is_online,
  dp.state,
  dp.active_service_type,
  dp.current_order_id,
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
  v.id as active_vehicle_id,
  v.vehicle_type,
  v.seat_count,
  v.max_weight_kg,
  v.max_volume_m3,
  v.approval_status,
  v.is_active
from public.profiles p
left join lateral (
  select status
  from public.driver_applications da0
  where da0.user_id = p.id
  order by da0.created_at desc
  limit 1
) da on true
left join public.driver_presence dp on dp.driver_id = p.id
left join public.driver_service_settings dss on dss.user_id = p.id
left join lateral (
  select id, vehicle_type, seat_count, max_weight_kg, max_volume_m3, approval_status, is_active
  from public.vehicles v0
  where v0.user_id = p.id
  order by v0.is_active desc, v0.updated_at desc nulls last, v0.created_at desc
  limit 1
) v on true;

comment on view app_meta.v_driver_core_matching_snapshot is 'Phase 6 cleanup: canonical driver matching snapshot based on presence + settings + vehicles';

commit;
