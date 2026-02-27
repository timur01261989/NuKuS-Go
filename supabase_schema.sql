-- NUKUS GO: Main Schema (orders, drivers, driver_presence, applications)
-- Bu fayl ikkinchi bajarilishi kerak (profiles va auth trigger dan keyin)

-- ============================================================
-- DRIVER APPLICATIONS (haydovchi tasdig'i)
-- ============================================================

create table if not exists public.driver_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending','approved','rejected')) default 'pending',
  documents jsonb,
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_driver_applications_user_id on public.driver_applications(user_id);
create index if not exists idx_driver_applications_status on public.driver_applications(status);

alter table public.driver_applications enable row level security;

drop policy if exists "driver_applications_own" on public.driver_applications;
create policy "driver_applications_own" on public.driver_applications
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "driver_applications_insert_own" on public.driver_applications;
create policy "driver_applications_insert_own" on public.driver_applications
for insert to authenticated
with check (user_id = auth.uid());

-- ============================================================
-- DRIVER PRESENCE (online haydovchilar, real-time location)
-- ============================================================

create table if not exists public.driver_presence (
  driver_id uuid primary key references public.profiles(id) on delete cascade,
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

-- Trigger: driver_user_id va last_seen_at'ni auto-sync qilish
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

-- Indexes
create index if not exists idx_driver_presence_online_updated on public.driver_presence(is_online, updated_at desc);
create index if not exists idx_driver_presence_lat on public.driver_presence(lat);
create index if not exists idx_driver_presence_lng on public.driver_presence(lng);
create index if not exists idx_driver_presence_state on public.driver_presence(state);

alter table public.driver_presence enable row level security;

drop policy if exists "driver_presence_select_own" on public.driver_presence;
create policy "driver_presence_select_own" on public.driver_presence
for select to authenticated
using (driver_id = auth.uid());

drop policy if exists "driver_presence_select_online" on public.driver_presence;
create policy "driver_presence_select_online" on public.driver_presence
for select to authenticated
using (is_online = true);


-- ============================================================
-- DRIVER SERVICE PRESENCE (per-service online)
-- ============================================================

create table if not exists public.driver_service_presence (
  driver_id uuid not null references public.profiles(id) on delete cascade,
  service_type text not null check (service_type in ('taxi','delivery','freight','inter_prov','inter_district')),
  is_online boolean default false,
  last_seen_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (driver_id, service_type)
);

create index if not exists idx_driver_service_presence_online_seen
  on public.driver_service_presence(service_type, is_online, last_seen_at desc);

create or replace function public.touch_driver_service_presence()
returns trigger
language plpgsql
as $$
begin
  if new.last_seen_at is null then
    new.last_seen_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_driver_service_presence on public.driver_service_presence;
create trigger trg_touch_driver_service_presence
before insert or update on public.driver_service_presence
for each row execute function public.touch_driver_service_presence();

alter table public.driver_service_presence enable row level security;

drop policy if exists "driver_service_presence_select_own" on public.driver_service_presence;
create policy "driver_service_presence_select_own" on public.driver_service_presence
for select to authenticated
using (driver_id = auth.uid());

drop policy if exists "driver_service_presence_upsert_own" on public.driver_service_presence;
create policy "driver_service_presence_upsert_own" on public.driver_service_presence
for insert to authenticated
with check (driver_id = auth.uid());

drop policy if exists "driver_service_presence_update_own" on public.driver_service_presence;
create policy "driver_service_presence_update_own" on public.driver_service_presence
for update to authenticated
using (driver_id = auth.uid())
with check (driver_id = auth.uid());


drop policy if exists "driver_presence_upsert_own" on public.driver_presence;
create policy "driver_presence_upsert_own" on public.driver_presence
for insert to authenticated
with check (driver_id = auth.uid());

drop policy if exists "driver_presence_update_own" on public.driver_presence;
create policy "driver_presence_update_own" on public.driver_presence
for update to authenticated
using (driver_id = auth.uid())
with check (driver_id = auth.uid());

-- ============================================================
-- DRIVERS COMPATIBILITY TABLE (UI dashboard uchun)
-- ============================================================

create table if not exists public.drivers (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  is_online boolean not null default false,
  lat double precision,
  lng double precision,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_drivers_is_online on public.drivers(is_online);

alter table public.drivers enable row level security;

drop policy if exists "drivers_select_own" on public.drivers;
create policy "drivers_select_own" on public.drivers
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "drivers_upsert_own" on public.drivers;
create policy "drivers_upsert_own" on public.drivers
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "drivers_update_own" on public.drivers;
create policy "drivers_update_own" on public.drivers
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "drivers_select_online" on public.drivers;
create policy "drivers_select_online" on public.drivers
for select to authenticated
using (is_online = true);

-- ============================================================
-- ORDERS (asosiy order jadval - taxi, deliver, freight)
-- ============================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  passenger_id uuid references public.profiles(id) on delete set null,
  driver_id uuid references public.profiles(id) on delete set null,
  service_type text not null default 'taxi' check (service_type in ('taxi','delivery','freight','inter_prov','inter_district')),
  pickup jsonb,
  dropoff jsonb,
  status text not null default 'searching',
  price numeric,
  created_at timestamptz default now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  
  -- Inter-provincial fields
  from_region text,
  from_district text,
  to_region text,
  to_district text,
  scheduled_at timestamptz,
  seats_available integer default 4,
  gender_pref text default 'all',
  pickup_mode text default 'home',
  
  -- Metadata
  distance_km numeric,
  duration_minutes integer,
  rating integer,
  review text
);

create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_driver_id on public.orders(driver_id);
create index if not exists idx_orders_passenger_id on public.orders(passenger_id);
create index if not exists idx_orders_service_type on public.orders(service_type);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_orders_scheduled_at on public.orders(scheduled_at);

alter table public.orders enable row level security;

drop policy if exists "orders_insert_passenger" on public.orders;
create policy "orders_insert_passenger" on public.orders
for insert to authenticated
with check (passenger_id = auth.uid());

drop policy if exists "orders_select_own_or_assigned" on public.orders;
create policy "orders_select_own_or_assigned" on public.orders
for select to authenticated
using (passenger_id = auth.uid() or driver_id = auth.uid());

drop policy if exists "orders_update_passenger_or_driver" on public.orders;
create policy "orders_update_passenger_or_driver" on public.orders
for update to authenticated
using (passenger_id = auth.uid() or driver_id = auth.uid())
with check (passenger_id = auth.uid() or driver_id = auth.uid());

-- ============================================================
-- ORDER OFFERS (haydovchilar uchun offer queue)
-- ============================================================

create table if not exists public.order_offers (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  driver_id uuid not null references public.profiles(id) on delete cascade,
  driver_user_id uuid,
  status text not null check (status in ('sent','accepted','rejected','expired')) default 'sent',
  sent_at timestamptz default now(),
  expires_at timestamptz,
  responded_at timestamptz
);

create unique index if not exists uq_order_offers_order_driver on public.order_offers(order_id, driver_id);
create index if not exists idx_order_offers_order_status on public.order_offers(order_id, status);
create index if not exists idx_order_offers_driver_status on public.order_offers(driver_id, status);
create index if not exists idx_order_offers_status on public.order_offers(status);

-- Trigger: driver_user_id'ni auto-sync qilish
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

alter table public.order_offers enable row level security;

drop policy if exists "order_offers_select_driver" on public.order_offers;
create policy "order_offers_select_driver" on public.order_offers
for select to authenticated
using (driver_id = auth.uid() or driver_user_id = auth.uid());

-- ============================================================
-- HELPER FUNCTION: find_nearby_drivers
-- Haydovchilarni joylashuvi bo'yicha qidiriladi (PostGIS kerak emas)
-- ============================================================

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


-- ============================================================
-- HELPER FUNCTION: find_nearby_drivers_for_service
-- Per-service online bo‘yicha haydovchilarni qidirish
-- ============================================================

create or replace function public.find_nearby_drivers_for_service(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision,
  p_limit integer,
  p_service_type text,
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
      (p_radius_km / (111.0 * greatest(cos(radians(p_lat)), 0.2))) as dlng,
      lower(coalesce(p_service_type,'taxi')) as svc
  ),
  fresh as (
    select dp.driver_id, dp.lat, dp.lng
    from public.driver_presence dp
    join public.driver_applications da
      on da.user_id = dp.driver_id and da.status = 'approved'
    join public.driver_service_presence dsp
      on dsp.driver_id = dp.driver_id
    cross join params p
    where dp.lat is not null and dp.lng is not null
      and dp.updated_at >= now() - interval '25 seconds'
      and dsp.is_online = true
      and dsp.last_seen_at >= now() - interval '25 seconds'
      and dsp.service_type = p.svc
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

-- ============================================================
-- TRIP BOOKING REQUESTS (inter-provincial booking)
-- ============================================================

create table if not exists public.trip_booking_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  passenger_id uuid not null references public.profiles(id) on delete cascade,
  seats_booked integer not null default 1 check (seats_booked > 0),
  status text not null check (status in ('pending','accepted','rejected','cancelled')) default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_trip_booking_order on public.trip_booking_requests(order_id);
create index if not exists idx_trip_booking_passenger on public.trip_booking_requests(passenger_id);
create index if not exists idx_trip_booking_status on public.trip_booking_requests(status);

alter table public.trip_booking_requests enable row level security;

drop policy if exists "trip_booking_select_own" on public.trip_booking_requests;
create policy "trip_booking_select_own" on public.trip_booking_requests
for select to authenticated
using (passenger_id = auth.uid());

drop policy if exists "trip_booking_insert_own" on public.trip_booking_requests;
create policy "trip_booking_insert_own" on public.trip_booking_requests
for insert to authenticated
with check (passenger_id = auth.uid());

-- ============================================================
-- ORDER EVENTS (order status tarix)
-- ============================================================

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null,
  event_data jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_order_events_order on public.order_events(order_id);
create index if not exists idx_order_events_type on public.order_events(event_type);

-- ============================================================
-- SOS TICKETS (xavfsizlik)
-- ============================================================

create table if not exists public.sos_tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  ticket_type text not null check (ticket_type in ('unsafe_driver','unsafe_passenger','accident','medical')),
  description text,
  location jsonb,
  status text not null default 'open' check (status in ('open','investigating','resolved','closed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_sos_tickets_user on public.sos_tickets(user_id);
create index if not exists idx_sos_tickets_order on public.sos_tickets(order_id);
create index if not exists idx_sos_tickets_status on public.sos_tickets(status);

-- ============================================================
-- MESSAGES (chat uchun)
-- ============================================================

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  message_text text,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_messages_order on public.messages(order_id);
create index if not exists idx_messages_sender on public.messages(sender_id);
create index if not exists idx_messages_recipient on public.messages(recipient_id);

alter table public.messages enable row level security;

drop policy if exists "messages_select_own" on public.messages;
create policy "messages_select_own" on public.messages
for select to authenticated
using (sender_id = auth.uid() or recipient_id = auth.uid());

drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own" on public.messages
for insert to authenticated
with check (sender_id = auth.uid());

-- ============================================================
-- TRAFFIC ZONES (hromat zonaları)
-- ============================================================

create table if not exists public.traffic_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  zone_geom jsonb,
  severity text check (severity in ('low','medium','high')) default 'medium',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_traffic_zones_active on public.traffic_zones(is_active);

-- ============================================================
-- GRANTS
-- ============================================================

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
