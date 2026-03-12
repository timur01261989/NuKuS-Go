begin;

create extension if not exists pgcrypto;

alter table if exists public.driver_applications
  add column if not exists requested_vehicle_type text,
  add column if not exists requested_service_types jsonb not null default '{
    "city": {"passenger": true, "delivery": true, "freight": false},
    "intercity": {"passenger": true, "delivery": true, "freight": false},
    "interdistrict": {"passenger": true, "delivery": true, "freight": false}
  }'::jsonb;

update public.driver_applications
set requested_vehicle_type = coalesce(requested_vehicle_type, transport_type)
where requested_vehicle_type is null;

create table if not exists public.driver_service_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  service_types jsonb not null default '{
    "city": {"passenger": true, "delivery": true, "freight": false},
    "intercity": {"passenger": true, "delivery": true, "freight": false},
    "interdistrict": {"passenger": true, "delivery": true, "freight": false}
  }'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.driver_service_settings (user_id, service_types)
select da.user_id, coalesce(da.requested_service_types, '{
  "city": {"passenger": true, "delivery": true, "freight": false},
  "intercity": {"passenger": true, "delivery": true, "freight": false},
  "interdistrict": {"passenger": true, "delivery": true, "freight": false}
}'::jsonb)
from public.driver_applications da
on conflict (user_id) do update
set service_types = excluded.service_types,
    updated_at = now();

alter table if exists public.vehicles
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists vehicle_type text,
  add column if not exists plate_number text,
  add column if not exists seat_count integer,
  add column if not exists max_weight_kg numeric(10,2),
  add column if not exists max_volume_m3 numeric(10,2),
  add column if not exists approval_status text not null default 'approved',
  add column if not exists is_active boolean not null default false,
  add column if not exists current_point jsonb;

update public.vehicles
set user_id = coalesce(user_id, driver_id)
where user_id is null and driver_id is not null;

update public.vehicles
set plate_number = coalesce(plate_number, plate)
where plate_number is null and plate is not null;

update public.vehicles
set seat_count = coalesce(seat_count, (metadata->>'seat_count')::integer, 0)
where seat_count is null;

update public.vehicles
set max_weight_kg = coalesce(max_weight_kg, capacity_kg)
where max_weight_kg is null and capacity_kg is not null;

update public.vehicles
set max_volume_m3 = coalesce(max_volume_m3, capacity_m3)
where max_volume_m3 is null and capacity_m3 is not null;

create index if not exists vehicles_user_id_idx on public.vehicles(user_id, created_at desc);
create index if not exists vehicles_user_id_active_idx on public.vehicles(user_id, is_active);

create table if not exists public.vehicle_change_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_id uuid null references public.vehicles(id) on delete set null,
  request_type text not null check (request_type in ('add_vehicle', 'change_vehicle')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  payload jsonb not null default '{}'::jsonb,
  admin_note text,
  reviewed_by uuid null references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vehicle_change_requests_user_id_idx on public.vehicle_change_requests(user_id, created_at desc);
create index if not exists vehicle_change_requests_status_idx on public.vehicle_change_requests(status, created_at desc);

alter table if exists public.driver_service_settings enable row level security;
alter table if exists public.vehicle_change_requests enable row level security;
alter table if exists public.vehicles enable row level security;

drop policy if exists driver_service_settings_select_own on public.driver_service_settings;
create policy driver_service_settings_select_own
on public.driver_service_settings
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists driver_service_settings_insert_own on public.driver_service_settings;
create policy driver_service_settings_insert_own
on public.driver_service_settings
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists driver_service_settings_update_own on public.driver_service_settings;
create policy driver_service_settings_update_own
on public.driver_service_settings
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists vehicles_select_own_user_id on public.vehicles;
create policy vehicles_select_own_user_id
on public.vehicles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists vehicles_insert_own_user_id on public.vehicles;
create policy vehicles_insert_own_user_id
on public.vehicles
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists vehicles_update_own_user_id on public.vehicles;
create policy vehicles_update_own_user_id
on public.vehicles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists vehicle_change_requests_select_own on public.vehicle_change_requests;
create policy vehicle_change_requests_select_own
on public.vehicle_change_requests
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists vehicle_change_requests_insert_own on public.vehicle_change_requests;
create policy vehicle_change_requests_insert_own
on public.vehicle_change_requests
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists vehicle_change_requests_update_own on public.vehicle_change_requests;
create policy vehicle_change_requests_update_own
on public.vehicle_change_requests
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

commit;
