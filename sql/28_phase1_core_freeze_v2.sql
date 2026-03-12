-- UniGo 1-bosqich v2: core freeze
-- Muhim farq:
-- driver_presence jadvali hozircha driver_id bilan qoldiriladi
-- user_id ga majburlab o'tkazilmaydi

create extension if not exists pgcrypto;

-- 1. profiles.active_vehicle_id
alter table public.profiles
add column if not exists active_vehicle_id uuid;

-- 2. driver_service_settings boolean ustunlari
alter table public.driver_service_settings
add column if not exists city_passenger boolean not null default false;

alter table public.driver_service_settings
add column if not exists city_delivery boolean not null default false;

alter table public.driver_service_settings
add column if not exists city_freight boolean not null default false;

alter table public.driver_service_settings
add column if not exists intercity_passenger boolean not null default false;

alter table public.driver_service_settings
add column if not exists intercity_delivery boolean not null default false;

alter table public.driver_service_settings
add column if not exists intercity_freight boolean not null default false;

alter table public.driver_service_settings
add column if not exists interdistrict_passenger boolean not null default false;

alter table public.driver_service_settings
add column if not exists interdistrict_delivery boolean not null default false;

alter table public.driver_service_settings
add column if not exists interdistrict_freight boolean not null default false;

alter table public.driver_service_settings
add column if not exists updated_at timestamptz not null default now();

-- 3. vehicles ni standartlash
alter table public.vehicles
add column if not exists vehicle_type text;

alter table public.vehicles
add column if not exists plate_number text;

alter table public.vehicles
add column if not exists seat_count integer not null default 0;

alter table public.vehicles
add column if not exists max_weight_kg numeric(10,2) not null default 0;

alter table public.vehicles
add column if not exists max_volume_m3 numeric(10,3) not null default 0;

alter table public.vehicles
add column if not exists approval_status text not null default 'pending';

alter table public.vehicles
add column if not exists is_active boolean not null default false;

alter table public.vehicles
add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'vehicles_approval_status_check'
  ) then
    alter table public.vehicles
    add constraint vehicles_approval_status_check
    check (approval_status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'vehicles_vehicle_type_check'
  ) then
    alter table public.vehicles
    add constraint vehicles_vehicle_type_check
    check (
      vehicle_type is null
      or vehicle_type in ('light_car', 'minibus', 'bus', 'small_truck', 'big_truck')
    );
  end if;
end $$;

-- 4. vehicles.user_id -> auth.users(id)
alter table public.vehicles
drop constraint if exists vehicles_user_id_fkey;

alter table public.vehicles
add constraint vehicles_user_id_fkey
foreign key (user_id)
references auth.users(id)
on delete cascade;

-- 5. active vehicle FK
alter table public.profiles
drop constraint if exists profiles_active_vehicle_id_fkey;

alter table public.profiles
add constraint profiles_active_vehicle_id_fkey
foreign key (active_vehicle_id)
references public.vehicles(id)
on delete set null;

-- 6. bitta user = bitta active vehicle
create unique index if not exists uniq_active_vehicle_per_user
on public.vehicles(user_id)
where is_active = true;

-- 7. driver_presence jadvali:
-- hozircha driver_id bilan qoldiriladi
alter table public.driver_presence
add column if not exists active_service_area text;

alter table public.driver_presence
add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'driver_presence_active_service_area_check'
  ) then
    alter table public.driver_presence
    add constraint driver_presence_active_service_area_check
    check (
      active_service_area is null
      or active_service_area in ('city', 'intercity', 'interdistrict')
    );
  end if;
end $$;

-- driver_presence.driver_id -> auth.users(id)
alter table public.driver_presence
drop constraint if exists driver_presence_driver_id_fkey;

alter table public.driver_presence
add constraint driver_presence_driver_id_fkey
foreign key (driver_id)
references auth.users(id)
on delete cascade;

create unique index if not exists idx_driver_presence_driver_id_unique
on public.driver_presence(driver_id);

-- 8. vehicle_change_requests
alter table public.vehicle_change_requests
add column if not exists vehicle_id uuid;

alter table public.vehicle_change_requests
add column if not exists request_type text;

alter table public.vehicle_change_requests
add column if not exists payload jsonb not null default '{}'::jsonb;

alter table public.vehicle_change_requests
add column if not exists status text not null default 'pending';

alter table public.vehicle_change_requests
add column if not exists reviewed_at timestamptz;

alter table public.vehicle_change_requests
drop constraint if exists vehicle_change_requests_user_id_fkey;

alter table public.vehicle_change_requests
add constraint vehicle_change_requests_user_id_fkey
foreign key (user_id)
references auth.users(id)
on delete cascade;

alter table public.vehicle_change_requests
drop constraint if exists vehicle_change_requests_vehicle_id_fkey;

alter table public.vehicle_change_requests
add constraint vehicle_change_requests_vehicle_id_fkey
foreign key (vehicle_id)
references public.vehicles(id)
on delete set null;

-- 9. wallets
alter table public.wallets
drop constraint if exists wallets_user_id_fkey;

alter table public.wallets
add constraint wallets_user_id_fkey
foreign key (user_id)
references auth.users(id)
on delete cascade;

alter table public.wallet_transactions
drop constraint if exists wallet_transactions_user_id_fkey;

alter table public.wallet_transactions
add constraint wallet_transactions_user_id_fkey
foreign key (user_id)
references auth.users(id)
on delete cascade;

-- 10. orders
alter table public.orders
drop constraint if exists orders_user_id_fkey;

alter table public.orders
add constraint orders_user_id_fkey
foreign key (user_id)
references auth.users(id)
on delete cascade;

alter table public.orders
add column if not exists assigned_driver_user_id uuid;

alter table public.orders
add column if not exists assigned_vehicle_id uuid;

alter table public.orders
add column if not exists service_area text;

alter table public.orders
add column if not exists order_type text;

alter table public.orders
add column if not exists updated_at timestamptz not null default now();

alter table public.orders
drop constraint if exists orders_assigned_driver_user_id_fkey;

alter table public.orders
add constraint orders_assigned_driver_user_id_fkey
foreign key (assigned_driver_user_id)
references auth.users(id)
on delete set null;

alter table public.orders
drop constraint if exists orders_assigned_vehicle_id_fkey;

alter table public.orders
add constraint orders_assigned_vehicle_id_fkey
foreign key (assigned_vehicle_id)
references public.vehicles(id)
on delete set null;

-- 11. indekslar
create index if not exists idx_driver_service_settings_user_id
on public.driver_service_settings(user_id);

create index if not exists idx_vehicles_user_id
on public.vehicles(user_id);

create index if not exists idx_vehicle_change_requests_user_id
on public.vehicle_change_requests(user_id);

create index if not exists idx_orders_user_id
on public.orders(user_id);

create index if not exists idx_orders_assigned_driver_user_id
on public.orders(assigned_driver_user_id);

-- 12. updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_driver_service_settings_updated_at on public.driver_service_settings;
create trigger trg_driver_service_settings_updated_at
before update on public.driver_service_settings
for each row
execute function public.set_updated_at();

drop trigger if exists trg_vehicles_updated_at on public.vehicles;
create trigger trg_vehicles_updated_at
before update on public.vehicles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_driver_presence_updated_at on public.driver_presence;
create trigger trg_driver_presence_updated_at
before update on public.driver_presence
for each row
execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

-- 13. driver_service_settings row yo'q profillar uchun yaratish
insert into public.driver_service_settings (user_id)
select p.id
from public.profiles p
left join public.driver_service_settings dss on dss.user_id = p.id
where dss.user_id is null
on conflict do nothing;

-- 14. driver_presence row yo'q profillar uchun yaratish
-- hozircha driver_id = profiles.id modeli ishlatiladi
insert into public.driver_presence (driver_id, is_online)
select p.id, false
from public.profiles p
left join public.driver_presence dp on dp.driver_id = p.id
where dp.driver_id is null
on conflict do nothing;
