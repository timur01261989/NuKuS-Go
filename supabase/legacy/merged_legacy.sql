-- Legacy schemas merged for reference (do not run twice without review)



-- ===== FILE: supabase.sql =====
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


-- ===== FILE: supabase_gamification_schema.sql =====
-- NUKUS GO: Gamification Schema
-- Bu fayl üçüncü bajarilishi kerak (asosiy schema dan keyin)

-- ============================================================
-- DRIVER LEVELS (haydovchi darajalari)
-- ============================================================

create table if not exists public.driver_levels (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  min_trips integer not null default 0,
  min_rating numeric not null default 0,
  commission_rate numeric default 0.15,
  priority_dispatch boolean default false,
  badge_emoji text,
  badge_color text,
  bonus_multiplier numeric default 1.0,
  sort_order integer not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_driver_levels_sort on public.driver_levels(sort_order);

-- Default levels
insert into public.driver_levels (name, min_trips, min_rating, commission_rate, badge_emoji, badge_color, sort_order)
values
  ('Yangi', 0, 0, 0.15, '👤', '#gray', 1),
  ('Tajribali', 50, 4.0, 0.12, '⭐', '#blue', 2),
  ('Professional', 200, 4.5, 0.10, '🏆', '#gold', 3),
  ('Ustalar', 500, 4.8, 0.08, '👑', '#purple', 4)
on conflict (name) do nothing;

-- ============================================================
-- DRIVER GAMIFICATION (haydovchi statistikasi)
-- ============================================================

create table if not exists public.driver_gamification (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null unique references public.profiles(id) on delete cascade,
  level_name text not null default 'Yangi' references public.driver_levels(name),
  total_trips integer not null default 0,
  total_earnings_uzs numeric not null default 0,
  bonus_points integer not null default 0,
  streak_days integer not null default 0,
  last_trip_date date,
  rating numeric default 5.0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_driver_gamif_driver_id on public.driver_gamification(driver_id);
create index if not exists idx_driver_gamif_level on public.driver_gamification(level_name);

alter table public.driver_gamification enable row level security;

drop policy if exists "driver_gamif_select_own" on public.driver_gamification;
create policy "driver_gamif_select_own" on public.driver_gamification
for select to authenticated
using (driver_id = auth.uid());

-- ============================================================
-- DAILY MISSIONS (kunlik missiyalar)
-- ============================================================

create table if not exists public.daily_missions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  target_type text not null check (target_type in ('trips','earnings','distance','rating')),
  target_value integer not null,
  bonus_uzs numeric default 0,
  bonus_points integer default 0,
  level_name text references public.driver_levels(name),
  is_active boolean default true,
  valid_from date default current_date,
  valid_to date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_daily_missions_active on public.daily_missions(is_active);
create index if not exists idx_daily_missions_level on public.daily_missions(level_name);

-- ============================================================
-- MISSION PROGRESS (haydovchining missiyadagi progres)
-- ============================================================

create table if not exists public.mission_progress (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.daily_missions(id) on delete cascade,
  driver_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  current_value integer not null default 0,
  completed boolean default false,
  rewarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists uq_mission_progress on public.mission_progress(mission_id, driver_id, date);
create index if not exists idx_mission_progress_driver on public.mission_progress(driver_id);
create index if not exists idx_mission_progress_date on public.mission_progress(date);

alter table public.mission_progress enable row level security;

drop policy if exists "mission_progress_select_own" on public.mission_progress;
create policy "mission_progress_select_own" on public.mission_progress
for select to authenticated
using (driver_id = auth.uid());

-- ============================================================
-- CLIENT BONUSES (mijozlar bonus ball)
-- ============================================================

create table if not exists public.client_bonuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  points integer not null default 0,
  total_earned integer not null default 0,
  total_spent integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_client_bonuses_user on public.client_bonuses(user_id);

alter table public.client_bonuses enable row level security;

drop policy if exists "client_bonuses_select_own" on public.client_bonuses;
create policy "client_bonuses_select_own" on public.client_bonuses
for select to authenticated
using (user_id = auth.uid());

-- ============================================================
-- BONUS TRANSACTIONS (bonus ball tarixi)
-- ============================================================

create table if not exists public.bonus_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('earn','spend','refund')),
  points integer not null,
  uzs_value numeric,
  order_id uuid references public.orders(id) on delete set null,
  note text,
  created_at timestamptz default now()
);

create index if not exists idx_bonus_tx_user on public.bonus_transactions(user_id);
create index if not exists idx_bonus_tx_kind on public.bonus_transactions(kind);
create index if not exists idx_bonus_tx_created on public.bonus_transactions(created_at desc);

alter table public.bonus_transactions enable row level security;

drop policy if exists "bonus_tx_select_own" on public.bonus_transactions;
create policy "bonus_tx_select_own" on public.bonus_transactions
for select to authenticated
using (user_id = auth.uid());

-- ============================================================
-- GRANTS
-- ============================================================

grant select, insert, update, delete on public.driver_levels to authenticated;
grant select, insert, update, delete on public.driver_gamification to authenticated;
grant select, insert, update, delete on public.daily_missions to authenticated;
grant select, insert, update, delete on public.mission_progress to authenticated;
grant select, insert, update, delete on public.client_bonuses to authenticated;
grant select, insert, update, delete on public.bonus_transactions to authenticated;

grant select on all tables in schema public to anon;
grant usage, select, update on all sequences in schema public to authenticated;


-- ===== FILE: supabase_min_auth_schema_FIXED.sql =====
-- NUKUS GO: Minimal Auth Schema (profiles, roles, auth trigger)
-- Bu fayl birinchi bajarilishi kerak
-- Run in Supabase SQL Editor

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES TABLE (barcha foydalanuvchilar)
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('client','driver','admin')) default 'client',
  full_name text,
  phone text,
  avatar_url text,
  is_verified boolean default false,
  language text default 'uz',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_phone on public.profiles(phone);

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS Policies
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

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

-- ============================================================
-- AUTH TRIGGER: Yangi user create qilganda profile yaratish
-- ============================================================

create or replace function public.create_profile_on_signup()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_on_signup();

-- ============================================================
-- GRANTS
-- ============================================================

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.profiles to anon;
grant usage, select on all sequences in schema public to authenticated;


-- ===== FILE: supabase_notifications_schema.sql =====
-- NUKUS GO: Notifications Schema
-- Bu fayl beshinchi bajarilishi kerak

-- ============================================================
-- NOTIFICATIONS (barcha bildirishnomalar)
-- ============================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  action_url text,
  notif_type text check (notif_type in ('order','promo','system','driver','payment')),
  is_read boolean default false,
  sent_at timestamptz default now(),
  read_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(is_read);
create index if not exists idx_notifications_type on public.notifications(notif_type);
create index if not exists idx_notifications_created on public.notifications(created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ============================================================
-- PUSH SUBSCRIPTIONS (web push subscriber)
-- ============================================================

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists uq_push_subscriptions_endpoint on public.push_subscriptions(endpoint);
create index if not exists idx_push_subs_user on public.push_subscriptions(user_id);
create index if not exists idx_push_subs_active on public.push_subscriptions(is_active);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subs_insert_own" on public.push_subscriptions;
create policy "push_subs_insert_own" on public.push_subscriptions
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "push_subs_select_own" on public.push_subscriptions;
create policy "push_subs_select_own" on public.push_subscriptions
for select to authenticated
using (user_id = auth.uid());

-- ============================================================
-- SMS LOG (SMS xabarlar tarixi)
-- ============================================================

create table if not exists public.sms_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  phone_number text not null,
  message_text text not null,
  sms_type text check (sms_type in ('verification','otp','notification','alert')),
  status text not null check (status in ('pending','sent','failed','delivered')) default 'pending',
  provider text,
  provider_message_id text,
  sent_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_sms_logs_user on public.sms_logs(user_id);
create index if not exists idx_sms_logs_phone on public.sms_logs(phone_number);
create index if not exists idx_sms_logs_status on public.sms_logs(status);

-- ============================================================
-- EMAIL LOG (Email xabarlar tarixi)
-- ============================================================

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  email_address text not null,
  subject text not null,
  html_body text,
  email_type text check (email_type in ('verification','receipt','notification','promo')),
  status text not null check (status in ('pending','sent','failed','bounced')) default 'pending',
  provider text,
  provider_message_id text,
  sent_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_email_logs_user on public.email_logs(user_id);
create index if not exists idx_email_logs_email on public.email_logs(email_address);
create index if not exists idx_email_logs_status on public.email_logs(status);

-- ============================================================
-- NOTIFICATION PREFERENCES (foydalanuvchi sozlamalari)
-- ============================================================

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  push_enabled boolean default true,
  sms_enabled boolean default true,
  email_enabled boolean default true,
  order_notifications boolean default true,
  promo_notifications boolean default true,
  system_notifications boolean default true,
  driver_notifications boolean default true,
  quiet_hours_enabled boolean default false,
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_notif_prefs_user on public.notification_preferences(user_id);

alter table public.notification_preferences enable row level security;

drop policy if exists "notif_prefs_select_own" on public.notification_preferences;
create policy "notif_prefs_select_own" on public.notification_preferences
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "notif_prefs_upsert_own" on public.notification_preferences;
create policy "notif_prefs_upsert_own" on public.notification_preferences
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "notif_prefs_update_own" on public.notification_preferences;
create policy "notif_prefs_update_own" on public.notification_preferences
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ============================================================
-- GRANTS
-- ============================================================

grant select, insert, update, delete on public.notifications to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant select, insert on public.sms_logs to authenticated;
grant select, insert on public.email_logs to authenticated;
grant select, insert, update, delete on public.notification_preferences to authenticated;

grant select on all tables in schema public to anon;
grant usage, select, update on all sequences in schema public to authenticated;


-- ===== FILE: supabase_schema.sql =====
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


-- ===== FILE: supabase_wallet_schema.sql =====
-- NUKUS GO: Wallet Schema
-- Bu fayl to'rtinchi bajarilishi kerak

-- ============================================================
-- WALLETS (foydalanuvchi hisobvaraqlari)
-- ============================================================

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  balance_uzs numeric not null default 0,
  total_topup_uzs numeric not null default 0,
  total_spent_uzs numeric not null default 0,
  frozen_uzs numeric not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_wallets_user on public.wallets(user_id);
create index if not exists idx_wallets_balance on public.wallets(balance_uzs);

alter table public.wallets enable row level security;

drop policy if exists "wallets_select_own" on public.wallets;
create policy "wallets_select_own" on public.wallets
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "wallets_update_own" on public.wallets;
create policy "wallets_update_own" on public.wallets
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ============================================================
-- WALLET TRANSACTIONS (hisob kuzatmasi)
-- ============================================================

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_uzs numeric not null,
  kind text not null check (kind in ('topup','spend','cashback','bonus','refund')),
  description text,
  order_id uuid references public.orders(id) on delete set null,
  reference_id text,
  meta jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_wallet_tx_user on public.wallet_transactions(user_id);
create index if not exists idx_wallet_tx_kind on public.wallet_transactions(kind);
create index if not exists idx_wallet_tx_created on public.wallet_transactions(created_at desc);
create index if not exists idx_wallet_tx_order on public.wallet_transactions(order_id);

alter table public.wallet_transactions enable row level security;

drop policy if exists "wallet_tx_select_own" on public.wallet_transactions;
create policy "wallet_tx_select_own" on public.wallet_transactions
for select to authenticated
using (user_id = auth.uid());

-- ============================================================
-- PROMO CODES (promokodlar)
-- ============================================================

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('fixed','percent')),
  discount_value numeric not null,
  max_uses integer,
  used_count integer default 0,
  min_order_value numeric,
  max_discount_uzs numeric,
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  is_active boolean default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_promo_codes_active on public.promo_codes(is_active);
create index if not exists idx_promo_codes_code on public.promo_codes(code);

-- ============================================================
-- PROMO CODE USAGE (promokod foydalanish tarixi)
-- ============================================================

create table if not exists public.promo_code_usage (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid not null references public.promo_codes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  discount_uzs numeric not null,
  used_at timestamptz default now()
);

create index if not exists idx_promo_usage_user on public.promo_code_usage(user_id);
create index if not exists idx_promo_usage_code on public.promo_code_usage(promo_code_id);
create index if not exists idx_promo_usage_order on public.promo_code_usage(order_id);

-- ============================================================
-- CASHBACK (kash-bek tashlamalar)
-- ============================================================

create table if not exists public.cashback_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  cashback_uzs numeric not null,
  cashback_rate numeric not null,
  status text not null check (status in ('pending','credited','declined')) default 'pending',
  created_at timestamptz default now(),
  credited_at timestamptz
);

create index if not exists idx_cashback_user on public.cashback_records(user_id);
create index if not exists idx_cashback_order on public.cashback_records(order_id);
create index if not exists idx_cashback_status on public.cashback_records(status);

-- ============================================================
-- ATOMIC TRANSFER FUNCTION (xavfsiz pul o'tkazish)
-- ============================================================

create or replace function public.transfer_wallet_funds(
  p_from_user_id uuid,
  p_to_user_id uuid,
  p_amount_uzs numeric,
  p_description text default 'Transfer'
)
returns jsonb
language plpgsql
as $$
declare
  v_from_balance numeric;
  v_result jsonb;
begin
  -- Get and lock sender's wallet
  select balance_uzs into v_from_balance
  from public.wallets
  where user_id = p_from_user_id
  for update;

  if v_from_balance is null then
    return jsonb_build_object('ok', false, 'error', 'Sender wallet topilmadi');
  end if;

  if v_from_balance < p_amount_uzs then
    return jsonb_build_object('ok', false, 'error', 'Yetarli mablag'' yo''q');
  end if;

  -- Deduct from sender
  update public.wallets
  set balance_uzs = balance_uzs - p_amount_uzs,
      total_spent_uzs = total_spent_uzs + p_amount_uzs,
      updated_at = now()
  where user_id = p_from_user_id;

  -- Add to receiver
  insert into public.wallets (user_id, balance_uzs, total_topup_uzs, updated_at)
  values (p_to_user_id, p_amount_uzs, p_amount_uzs, now())
  on conflict (user_id) do update
  set balance_uzs = wallets.balance_uzs + p_amount_uzs,
      updated_at = now();

  -- Record transaction for sender
  insert into public.wallet_transactions (user_id, amount_uzs, kind, description)
  values (p_from_user_id, -p_amount_uzs, 'spend', p_description);

  -- Record transaction for receiver
  insert into public.wallet_transactions (user_id, amount_uzs, kind, description)
  values (p_to_user_id, p_amount_uzs, 'topup', p_description);

  return jsonb_build_object('ok', true, 'message', 'Transfer muvaffaqiyatli');
end;
$$;

-- ============================================================
-- GRANTS
-- ============================================================

grant select, insert, update, delete on public.wallets to authenticated;
grant select, insert, update on public.wallet_transactions to authenticated;
grant select on public.promo_codes to authenticated;
grant select, insert on public.promo_code_usage to authenticated;
grant select on public.cashback_records to authenticated;
grant select, insert, update on public.cashback_records to authenticated;

grant select on all tables in schema public to anon;
grant usage, select, update on all sequences in schema public to authenticated;
