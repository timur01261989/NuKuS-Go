create extension if not exists pgcrypto;

begin;

-- UniGo canonical schema.
-- Single universal identity: auth.users.id = profiles.id = all *.user_id references.
-- Legacy aliases removed: client_id, client_user_id, profiles.user_id, inter_prov_trips duplicate table.

-- SOURCE: sql/01_unigo_superapp_schema.sql
create extension if not exists pgcrypto;

begin;

-- =========================
-- COMMON FUNCTIONS
-- =========================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- =========================
-- PROFILES
-- single identity = auth.users.id
-- =========================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique,
  full_name text,
  avatar_url text,
  language_code text not null default 'uz_latn',
  "role" text not null default 'client',
  "current_role" text not null default 'client',
  first_name text,
  last_name text,
  father_name text,
  is_admin boolean not null default false,
  is_blocked boolean not null default false,
  is_deleted boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check ("role" in ('client','driver','both','admin')),
  constraint profiles_current_role_check check ("current_role" in ('client','driver','both','admin'))
);

create index if not exists idx_profiles_phone on public.profiles(phone);
create index if not exists idx_profiles_role on public.profiles("current_role");

drop trigger if exists trg_profiles_touch_updated_at on public.profiles;
create trigger trg_profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone, full_name, metadata)
  values (
    new.id,
    coalesce(new.phone, new.raw_user_meta_data ->> 'phone'),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data, '{}'::jsonb)
  )
  on conflict (id) do nothing;

  insert into public.wallets (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================
-- DRIVER APPLICATIONS
-- driver form data + documents
-- =========================
create table if not exists public.driver_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected','revoked')),
  first_name text,
  last_name text,
  father_name text,
  phone text,
  transport_type text not null check (transport_type in ('light_car','bus_gazel','truck')),
  vehicle_brand text,
  vehicle_model text,
  vehicle_year int,
  vehicle_plate text,
  vehicle_color text,
  seat_count int,
  requested_max_freight_weight_kg numeric(10,2),
  requested_payload_volume_m3 numeric(10,2),
  can_luggage boolean not null default false,
  passport_number text,
  driver_license_number text,
  tech_passport_number text,
  selfie_url text,
  passport_front_url text,
  passport_back_url text,
  tech_passport_front_url text,
  tech_passport_back_url text,
  driver_license_front_url text,
  driver_license_back_url text,
  car_photo_1 text,
  car_photo_2 text,
  car_photo_3 text,
  car_photo_4 text,
  rejection_reason text,
  admin_note text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_driver_applications_status on public.driver_applications(status);
create index if not exists idx_driver_applications_transport on public.driver_applications(transport_type);
drop trigger if exists trg_driver_applications_touch_updated_at on public.driver_applications;
create trigger trg_driver_applications_touch_updated_at
before update on public.driver_applications
for each row execute function public.touch_updated_at();

-- =========================
-- DRIVERS
-- approved driver capability profile
-- =========================
create table if not exists public.drivers (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  application_id uuid unique references public.driver_applications(id) on delete set null,
  transport_type text not null check (transport_type in ('light_car','bus_gazel','truck')),
  allowed_services text[] not null default '{}'::text[],
  seat_count int not null default 0,
  max_freight_weight_kg numeric(10,2) not null default 0,
  payload_volume_m3 numeric(10,2) not null default 0,
  can_luggage boolean not null default false,
  vehicle_brand text,
  vehicle_model text,
  vehicle_year int,
  vehicle_plate text,
  vehicle_color text,
  is_verified boolean not null default false,
  is_active boolean not null default true,
  is_suspended boolean not null default false,
  rating numeric(3,2) not null default 5.00,
  total_completed_orders int not null default 0,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_drivers_transport on public.drivers(transport_type);
create index if not exists idx_drivers_verified on public.drivers(is_verified, is_active, is_suspended);
create index if not exists idx_drivers_allowed_services on public.drivers using gin(allowed_services);
drop trigger if exists trg_drivers_touch_updated_at on public.drivers;
create trigger trg_drivers_touch_updated_at
before update on public.drivers
for each row execute function public.touch_updated_at();

create or replace function public.apply_driver_permissions(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  app_row public.driver_applications%rowtype;
  v_allowed_services text[];
  v_max_freight numeric(10,2);
  v_seat_count int;
  v_payload numeric(10,2);
begin
  select * into app_row
  from public.driver_applications
  where user_id = p_user_id;

  if not found then
    raise exception 'Driver application not found for user %', p_user_id;
  end if;

  if app_row.status <> 'approved' then
    raise exception 'Application must be approved before permissions are applied';
  end if;

  if app_row.transport_type = 'light_car' then
    v_allowed_services := array['taxi','delivery','inter_district','inter_city','freight'];
    v_max_freight := greatest(coalesce(app_row.requested_max_freight_weight_kg, 100), 50);
    v_seat_count := greatest(coalesce(app_row.seat_count, 4), 1);
    v_payload := coalesce(app_row.requested_payload_volume_m3, 0.8);
  elsif app_row.transport_type = 'bus_gazel' then
    v_allowed_services := array['delivery','inter_district','inter_city','freight'];
    v_max_freight := greatest(coalesce(app_row.requested_max_freight_weight_kg, 1500), 300);
    v_seat_count := greatest(coalesce(app_row.seat_count, 8), 2);
    v_payload := coalesce(app_row.requested_payload_volume_m3, 6.0);
  else
    v_allowed_services := array['freight'];
    v_max_freight := greatest(coalesce(app_row.requested_max_freight_weight_kg, 20000), 1000);
    v_seat_count := 0;
    v_payload := coalesce(app_row.requested_payload_volume_m3, 30.0);
  end if;

  insert into public.drivers (
    user_id,
    application_id,
    transport_type,
    allowed_services,
    seat_count,
    max_freight_weight_kg,
    payload_volume_m3,
    can_luggage,
    vehicle_brand,
    vehicle_model,
    vehicle_year,
    vehicle_plate,
    vehicle_color,
    is_verified,
    is_active,
    approved_at
  ) values (
    app_row.user_id,
    app_row.id,
    app_row.transport_type,
    v_allowed_services,
    v_seat_count,
    v_max_freight,
    v_payload,
    app_row.can_luggage,
    app_row.vehicle_brand,
    app_row.vehicle_model,
    app_row.vehicle_year,
    app_row.vehicle_plate,
    app_row.vehicle_color,
    true,
    true,
    now()
  )
  on conflict (user_id) do update set
    application_id = excluded.application_id,
    transport_type = excluded.transport_type,
    allowed_services = excluded.allowed_services,
    seat_count = excluded.seat_count,
    max_freight_weight_kg = excluded.max_freight_weight_kg,
    payload_volume_m3 = excluded.payload_volume_m3,
    can_luggage = excluded.can_luggage,
    vehicle_brand = excluded.vehicle_brand,
    vehicle_model = excluded.vehicle_model,
    vehicle_year = excluded.vehicle_year,
    vehicle_plate = excluded.vehicle_plate,
    vehicle_color = excluded.vehicle_color,
    is_verified = true,
    is_active = true,
    is_suspended = false,
    approved_at = now(),
    updated_at = now();

  insert into public.driver_presence (driver_id)
  values (app_row.user_id)
  on conflict (driver_id) do nothing;

  update public.profiles
     set "role" = case when "role" = 'client' then 'both' else "role" end,
         "current_role" = case when "current_role" = 'client' then 'both' else "current_role" end,
         updated_at = now()
   where id = app_row.user_id;
end;
$$;

-- =========================
-- DRIVER PRESENCE
-- single source of truth for online state
-- =========================
create table if not exists public.driver_presence (
  driver_id uuid primary key references public.drivers(user_id) on delete cascade,
  is_online boolean not null default false,
  state text not null default 'offline' check (state in ('offline','online','busy','paused')),
  active_service_type text check (active_service_type in ('taxi','delivery','inter_district','inter_city','freight')),
  current_order_id uuid,
  lat double precision,
  lng double precision,
  heading double precision,
  bearing double precision,
  speed double precision,
  accuracy double precision,
  device_id text,
  platform text,
  app_version text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_driver_presence_online on public.driver_presence(is_online, state, active_service_type);
create index if not exists idx_driver_presence_seen on public.driver_presence(last_seen_at desc);
drop trigger if exists trg_driver_presence_touch_updated_at on public.driver_presence;
create trigger trg_driver_presence_touch_updated_at
before update on public.driver_presence
for each row execute function public.touch_updated_at();

-- =========================
-- WALLETS
-- one wallet per user, same ID
-- =========================
create table if not exists public.wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance_uzs bigint not null default 0,
  reserved_uzs bigint not null default 0,
  total_topup_uzs bigint not null default 0,
  total_spent_uzs bigint not null default 0,
  total_earned_uzs bigint not null default 0,
  is_frozen boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_wallets_touch_updated_at on public.wallets;
create trigger trg_wallets_touch_updated_at
before update on public.wallets
for each row execute function public.touch_updated_at();

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.wallets(user_id) on delete cascade,
  driver_id uuid generated always as (user_id) stored,
  direction text not null default 'credit' check (direction in ('credit','debit')),
  kind text not null check (kind in ('topup','withdraw','order_payment','order_payout','commission','refund','ad_fee','manual_adjustment','spend','bonus')),
  service_type text,
  amount_uzs bigint not null check (amount_uzs > 0),
  amount bigint generated always as (amount_uzs) stored,
  type text generated always as (case when direction = 'credit' then 'income' else 'expense' end) stored,
  order_id uuid,
  ad_id uuid,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_wallet_transactions_user on public.wallet_transactions(user_id, created_at desc);
create index if not exists idx_wallet_transactions_order on public.wallet_transactions(order_id);
create index if not exists idx_wallet_transactions_ad on public.wallet_transactions(ad_id);

create table if not exists public.billing_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  service_type text not null check (service_type in ('taxi','delivery','inter_district','inter_city','freight','auto_market')),
  source_type text not null check (source_type in ('order','auto_ad','wallet','manual')),
  source_id uuid,
  transaction_type text not null check (transaction_type in ('charge','payout','commission','refund','hold','release')),
  amount_uzs bigint not null,
  status text not null default 'pending' check (status in ('pending','success','failed','cancelled')),
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_billing_transactions_user on public.billing_transactions(user_id, created_at desc);
create index if not exists idx_billing_transactions_source on public.billing_transactions(source_type, source_id);

-- =========================
-- ORDERS
-- single table for all mobility services
-- =========================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  driver_id uuid references public.profiles(id) on delete set null,
  service_type text not null check (service_type in ('taxi','delivery','inter_district','inter_city','freight')),
  status text not null default 'searching' check (status in ('draft','pending','searching','offered','accepted','arrived','in_progress','in_trip','completed','cancelled_by_client','cancelled_by_driver','cancelled','expired')),
  pickup jsonb,
  dropoff jsonb,
  from_location jsonb generated always as (pickup) stored,
  to_location jsonb generated always as (dropoff) stored,
  route_meta jsonb not null default '{}'::jsonb,
  cargo_title text,
  cargo_weight_kg numeric(10,2),
  cargo_volume_m3 numeric(10,2),
  passenger_count int,
  note text,
  payment_method text not null default 'cash' check (payment_method in ('cash','wallet','terminal','mixed')),
  price_uzs bigint,
  price bigint generated always as (price_uzs) stored,
  commission_uzs bigint not null default 0,
  driver_payout_uzs bigint not null default 0,
  rating numeric(3,2),
  offered_at timestamptz,
  accepted_at timestamptz,
  arrived_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_freight_payload check (
    service_type <> 'freight' or coalesce(cargo_weight_kg, 0) > 0
  )
);

create index if not exists idx_orders_user on public.orders(user_id, created_at desc);
create index if not exists idx_orders_driver on public.orders(driver_id, created_at desc);
create index if not exists idx_orders_status on public.orders(status, service_type, created_at desc);
drop trigger if exists trg_orders_touch_updated_at on public.orders;
create trigger trg_orders_touch_updated_at
before update on public.orders
for each row execute function public.touch_updated_at();


create table if not exists public.order_offers (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  driver_id uuid not null references public.drivers(user_id) on delete cascade,
  service_type text,
  dist_km numeric(10,3),
  score numeric(10,3),
  status text not null default 'sent' check (status in ('sent','accepted','rejected','expired')),
  sent_at timestamptz not null default now(),
  expires_at timestamptz,
  responded_at timestamptz,
  unique(order_id, driver_id)
);

create index if not exists idx_order_offers_order on public.order_offers(order_id, status);
create index if not exists idx_order_offers_driver on public.order_offers(driver_id, status);

create table if not exists public.order_events (
  id bigserial primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  actor_id uuid generated always as (actor_user_id) stored,
  actor_role text,
  event_code text not null,
  event text generated always as (event_code) stored,
  from_status text,
  to_status text,
  reason text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_events_order on public.order_events(order_id, created_at desc);

create table if not exists public.order_status_history (
  id bigserial primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  changed_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_status_history_order on public.order_status_history(order_id, created_at desc);

-- =========================
-- AUTO MARKET
-- same user id for owner + payment
-- =========================
create table if not exists public.auto_market_ads (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  user_id uuid generated always as (owner_user_id) stored,
  title text not null,
  description text,
  brand text,
  model text,
  year int,
  mileage_km int,
  price_uzs bigint,
  price bigint generated always as (price_uzs) stored,
  currency_code text not null default 'UZS',
  city text,
  body_type text,
  fuel_type text,
  transmission text,
  color text,
  engine text,
  vin text,
  is_credit boolean not null default false,
  kredit boolean generated always as (is_credit) stored,
  is_exchange boolean not null default false,
  exchange boolean generated always as (is_exchange) stored,
  seller_name text,
  seller_phone text,
  seller_rating numeric(3,2),
  is_top boolean not null default false,
  status text not null default 'draft' check (status in ('draft','pending_payment','pending_review','active','rejected','archived','sold')),
  publish_fee_uzs bigint not null default 0,
  top_fee_uzs bigint not null default 0,
  approved_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  views_count int not null default 0,
  views int generated always as (views_count) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_auto_market_ads_owner on public.auto_market_ads(owner_user_id, created_at desc);
create index if not exists idx_auto_market_ads_status on public.auto_market_ads(status, created_at desc);
create index if not exists idx_auto_market_ads_brand_model on public.auto_market_ads(brand, model);
drop trigger if exists trg_auto_market_ads_touch_updated_at on public.auto_market_ads;
create trigger trg_auto_market_ads_touch_updated_at
before update on public.auto_market_ads
for each row execute function public.touch_updated_at();

create table if not exists public.auto_market_images (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.auto_market_ads(id) on delete cascade,
  image_url text not null,
  url text generated always as (image_url) stored,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_auto_market_images_ad on public.auto_market_images(ad_id, sort_order);

create table if not exists public.auto_market_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ad_id uuid not null references public.auto_market_ads(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, ad_id)
);

create table if not exists public.auto_market_payments (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid references public.auto_market_ads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text default 'demo',
  payment_purpose text check (payment_purpose in ('publish_fee','top_fee','boost_fee','wallet_topup','reveal_phone')),
  amount_uzs bigint not null check (amount_uzs > 0),
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  wallet_transaction_id uuid references public.wallet_transactions(id) on delete set null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.auto_market_promotions (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.auto_market_ads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  promo_type text not null,
  amount_uzs bigint not null default 0,
  status text not null default 'active' check (status in ('active','expired','cancelled')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.auto_market_contact_reveals (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.auto_market_ads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  price_uzs bigint not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, ad_id)
);

create index if not exists idx_auto_market_payments_user on public.auto_market_payments(user_id, created_at desc);
create index if not exists idx_auto_market_payments_ad on public.auto_market_payments(ad_id, created_at desc);


create table if not exists public.auto_price_history (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.auto_market_ads(id) on delete cascade,
  at timestamptz not null default now(),
  price bigint not null,
  currency text not null default 'UZS'
);

-- =========================
-- ELIGIBLE DRIVER QUERY
-- =========================
create or replace function public.find_eligible_drivers(
  p_service_type text,
  p_cargo_weight_kg numeric default null,
  p_passenger_count integer default null,
  p_pickup_lat double precision default null,
  p_pickup_lng double precision default null,
  p_limit integer default 20,
  p_exclude_driver_ids uuid[] default '{}'
)
returns table (
  driver_id uuid,
  transport_type text,
  allowed_services text[],
  max_freight_weight_kg numeric,
  seat_count int,
  lat double precision,
  lng double precision,
  last_seen_at timestamptz
)
language sql
stable
as $$
  select
    d.user_id as driver_id,
    d.transport_type,
    d.allowed_services,
    d.max_freight_weight_kg,
    d.seat_count,
    dp.lat,
    dp.lng,
    dp.last_seen_at
  from public.drivers d
  join public.driver_presence dp on dp.driver_id = d.user_id
  where d.is_verified = true
    and d.is_active = true
    and d.is_suspended = false
    and dp.is_online = true
    and dp.state = 'online'
    and dp.last_seen_at >= now() - interval '30 seconds'
    and p_service_type = any(d.allowed_services)
    and (
      p_service_type <> 'freight'
      or coalesce(p_cargo_weight_kg, 0) <= d.max_freight_weight_kg
    )
    and (
      p_service_type <> 'taxi'
      or p_passenger_count is null
      or d.seat_count >= p_passenger_count
    )
    and (coalesce(p_exclude_driver_ids, '{}') = '{}'::uuid[] or d.user_id <> all(p_exclude_driver_ids))
  order by dp.last_seen_at desc
  limit greatest(p_limit, 1);
$$;

-- =========================
-- ATOMIC ORDER ACCEPT
-- =========================
create or replace function public.accept_order_atomic(
  p_order_id uuid,
  p_driver_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_driver public.drivers%rowtype;
  v_presence public.driver_presence%rowtype;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.driver_id is not null then
    raise exception 'Order already assigned';
  end if;

  if v_order.status not in ('searching','offered') then
    raise exception 'Order is not available for accept';
  end if;

  select * into v_driver
  from public.drivers
  where user_id = p_driver_id
  for update;

  if not found then
    raise exception 'Driver not found';
  end if;

  if v_driver.is_verified is distinct from true or v_driver.is_active is distinct from true or v_driver.is_suspended is true then
    raise exception 'Driver is not eligible';
  end if;

  if not (v_order.service_type = any(v_driver.allowed_services)) then
    raise exception 'Driver service permission denied';
  end if;

  if v_order.service_type = 'freight' and coalesce(v_order.cargo_weight_kg, 0) > v_driver.max_freight_weight_kg then
    raise exception 'Freight weight exceeds driver limit';
  end if;

  if v_order.service_type = 'taxi' and coalesce(v_order.passenger_count, 1) > coalesce(v_driver.seat_count, 0) then
    raise exception 'Passenger count exceeds seat count';
  end if;

  select * into v_presence
  from public.driver_presence
  where driver_id = p_driver_id
  for update;

  if not found then
    raise exception 'Driver presence not found';
  end if;

  if v_presence.is_online is distinct from true or v_presence.state <> 'online' then
    raise exception 'Driver is not online';
  end if;

  update public.orders
     set driver_id = p_driver_id,
         status = 'accepted',
         accepted_at = now(),
         updated_at = now()
   where id = p_order_id;

  update public.driver_presence
     set state = 'busy',
         current_order_id = p_order_id,
         updated_at = now(),
         last_seen_at = now()
   where driver_id = p_driver_id;

  update public.order_offers
     set status = case when driver_id = p_driver_id then 'accepted' else 'expired' end,
         responded_at = now()
   where order_id = p_order_id
     and status = 'sent';

  insert into public.order_events(order_id, actor_user_id, actor_role, event_code, from_status, to_status, payload)
  values (p_order_id, p_driver_id, 'driver', 'order.accepted', v_order.status, 'accepted', jsonb_build_object('driver_id', p_driver_id));

  insert into public.order_status_history(order_id, status, changed_by, note)
  values (p_order_id, 'accepted', p_driver_id, 'Accepted atomically');

  return jsonb_build_object('ok', true, 'order_id', p_order_id, 'driver_id', p_driver_id, 'status', 'accepted');
end;
$$;

create or replace function public.complete_order_atomic(
  p_order_id uuid,
  p_actor_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_wallet_balance bigint;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.driver_id <> p_actor_user_id then
    raise exception 'Only assigned driver can complete';
  end if;

  if v_order.status not in ('accepted','arrived','in_progress') then
    raise exception 'Order cannot be completed from current status';
  end if;

  update public.orders
     set status = 'completed',
         completed_at = now(),
         updated_at = now()
   where id = p_order_id;

  update public.driver_presence
     set state = 'online',
         current_order_id = null,
         last_seen_at = now(),
         updated_at = now()
   where driver_id = p_actor_user_id;

  if v_order.payment_method = 'wallet' and coalesce(v_order.price_uzs, 0) > 0 then
    select balance_uzs into v_wallet_balance
    from public.wallets
    where user_id = v_order.user_id
    for update;

    if coalesce(v_wallet_balance, 0) < v_order.price_uzs then
      raise exception 'Client wallet balance is insufficient';
    end if;

    update public.wallets
       set balance_uzs = balance_uzs - v_order.price_uzs,
           total_spent_uzs = total_spent_uzs + v_order.price_uzs,
           updated_at = now()
     where user_id = v_order.user_id;

    update public.wallets
       set balance_uzs = balance_uzs + coalesce(v_order.driver_payout_uzs, 0),
           total_earned_uzs = total_earned_uzs + coalesce(v_order.driver_payout_uzs, 0),
           updated_at = now()
     where user_id = v_order.driver_id;

    insert into public.wallet_transactions(user_id, direction, kind, service_type, amount_uzs, order_id, description)
    values
      (v_order.user_id, 'debit', 'order_payment', v_order.service_type, v_order.price_uzs, p_order_id, 'Order payment'),
      (v_order.driver_id, 'credit', 'order_payout', v_order.service_type, coalesce(v_order.driver_payout_uzs, 0), p_order_id, 'Driver payout');

    if coalesce(v_order.commission_uzs, 0) > 0 then
      insert into public.billing_transactions(user_id, service_type, source_type, source_id, transaction_type, amount_uzs, status, note)
      values (v_order.driver_id, v_order.service_type, 'order', p_order_id, 'commission', v_order.commission_uzs, 'success', 'Platform commission');
    end if;
  end if;

  update public.drivers
     set total_completed_orders = total_completed_orders + 1,
         updated_at = now()
   where user_id = v_order.driver_id;

  insert into public.order_events(order_id, actor_user_id, actor_role, event_code, from_status, to_status)
  values (p_order_id, p_actor_user_id, 'driver', 'order.completed', v_order.status, 'completed');

  insert into public.order_status_history(order_id, status, changed_by, note)
  values (p_order_id, 'completed', p_actor_user_id, 'Completed atomically');

  return jsonb_build_object('ok', true, 'order_id', p_order_id, 'status', 'completed');
end;
$$;

commit;


-- Compatibility read aliases intentionally removed for hard-clean single-ID schema.


-- =========================
-- SUPPORT / PUSH / NOTIFICATIONS (minimal compatibility)
-- =========================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text,
  body text,
  type text,
  data jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  token text not null,
  platform text,
  device_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, token)
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text,
  auth text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, endpoint)
);


-- SOURCE: sql/02_unigo_superapp_rls.sql
begin;

alter table public.profiles enable row level security;
alter table public.driver_applications enable row level security;
alter table public.drivers enable row level security;
alter table public.driver_presence enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.billing_transactions enable row level security;
alter table public.orders enable row level security;
alter table public.order_offers enable row level security;
alter table public.order_events enable row level security;
alter table public.order_status_history enable row level security;
alter table public.auto_market_ads enable row level security;
alter table public.auto_market_images enable row level security;
alter table public.auto_market_favorites enable row level security;
alter table public.auto_market_payments enable row level security;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists driver_applications_select_own on public.driver_applications;
drop policy if exists driver_applications_insert_own on public.driver_applications;
drop policy if exists driver_applications_update_own_pending on public.driver_applications;
drop policy if exists drivers_select_self on public.drivers;
drop policy if exists driver_presence_select_self on public.driver_presence;
drop policy if exists driver_presence_insert_self on public.driver_presence;
drop policy if exists driver_presence_update_self on public.driver_presence;
drop policy if exists wallets_select_own on public.wallets;
drop policy if exists wallet_transactions_select_own on public.wallet_transactions;
drop policy if exists billing_transactions_select_own on public.billing_transactions;
drop policy if exists orders_select_own_or_assigned on public.orders;
drop policy if exists orders_insert_own on public.orders;
drop policy if exists orders_insert_client on public.orders;
drop policy if exists orders_update_own on public.orders;
drop policy if exists orders_update_client_limited on public.orders;
drop policy if exists order_offers_select_driver on public.order_offers;
drop policy if exists order_events_select_participant on public.order_events;
drop policy if exists order_status_history_select_participant on public.order_status_history;
drop policy if exists auto_market_ads_select_public on public.auto_market_ads;
drop policy if exists auto_market_ads_insert_own on public.auto_market_ads;
drop policy if exists auto_market_ads_update_own on public.auto_market_ads;
drop policy if exists auto_market_images_select_public on public.auto_market_images;
drop policy if exists auto_market_images_insert_own on public.auto_market_images;
drop policy if exists auto_market_images_delete_own on public.auto_market_images;
drop policy if exists auto_market_favorites_select_own on public.auto_market_favorites;
drop policy if exists auto_market_favorites_write_own on public.auto_market_favorites;
drop policy if exists auto_market_payments_select_own on public.auto_market_payments;

-- profiles
create policy profiles_select_own on public.profiles
for select to authenticated
using (id = auth.uid());

create policy profiles_update_own on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- driver_applications
create policy driver_applications_select_own on public.driver_applications
for select to authenticated
using (user_id = auth.uid());

create policy driver_applications_insert_own on public.driver_applications
for insert to authenticated
with check (user_id = auth.uid());

create policy driver_applications_update_own_pending on public.driver_applications
for update to authenticated
using (user_id = auth.uid() and status = 'pending')
with check (user_id = auth.uid());

-- drivers
create policy drivers_select_self on public.drivers
for select to authenticated
using (user_id = auth.uid());

-- driver_presence
create policy driver_presence_select_self on public.driver_presence
for select to authenticated
using (driver_id = auth.uid());

create policy driver_presence_insert_self on public.driver_presence
for insert to authenticated
with check (driver_id = auth.uid());

create policy driver_presence_update_self on public.driver_presence
for update to authenticated
using (driver_id = auth.uid())
with check (driver_id = auth.uid());

-- wallets
create policy wallets_select_own on public.wallets
for select to authenticated
using (user_id = auth.uid());

-- wallet_transactions
create policy wallet_transactions_select_own on public.wallet_transactions
for select to authenticated
using (user_id = auth.uid());

-- billing_transactions
create policy billing_transactions_select_own on public.billing_transactions
for select to authenticated
using (user_id = auth.uid());

-- orders
create policy orders_select_own_or_assigned on public.orders
for select to authenticated
using (user_id = auth.uid() or driver_id = auth.uid());

create policy orders_insert_own on public.orders
for insert to authenticated
with check (user_id = auth.uid());

create policy orders_update_own on public.orders
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- order_offers
create policy order_offers_select_driver on public.order_offers
for select to authenticated
using (driver_id = auth.uid());

-- order_events
create policy order_events_select_participant on public.order_events
for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_events.order_id
      and (o.user_id = auth.uid() or o.driver_id = auth.uid())
  )
);

-- order_status_history
create policy order_status_history_select_participant on public.order_status_history
for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_status_history.order_id
      and (o.user_id = auth.uid() or o.driver_id = auth.uid())
  )
);

-- auto market ads
create policy auto_market_ads_select_public on public.auto_market_ads
for select
using (
  status = 'active' or owner_user_id = auth.uid()
);

create policy auto_market_ads_insert_own on public.auto_market_ads
for insert to authenticated
with check (owner_user_id = auth.uid());

create policy auto_market_ads_update_own on public.auto_market_ads
for update to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

-- auto market images
create policy auto_market_images_select_public on public.auto_market_images
for select
using (
  exists (
    select 1 from public.auto_market_ads a
    where a.id = auto_market_images.ad_id
      and (a.status = 'active' or a.owner_user_id = auth.uid())
  )
);

create policy auto_market_images_insert_own on public.auto_market_images
for insert to authenticated
with check (
  exists (
    select 1 from public.auto_market_ads a
    where a.id = auto_market_images.ad_id
      and a.owner_user_id = auth.uid()
  )
);

create policy auto_market_images_delete_own on public.auto_market_images
for delete to authenticated
using (
  exists (
    select 1 from public.auto_market_ads a
    where a.id = auto_market_images.ad_id
      and a.owner_user_id = auth.uid()
  )
);

-- auto market favorites
create policy auto_market_favorites_select_own on public.auto_market_favorites
for select to authenticated
using (user_id = auth.uid());

create policy auto_market_favorites_write_own on public.auto_market_favorites
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- auto market payments
create policy auto_market_payments_select_own on public.auto_market_payments
for select to authenticated
using (user_id = auth.uid());

commit;


-- SOURCE: sql/03_unigo_compat_feature_tables.sql
begin;

create extension if not exists pgcrypto;

create table if not exists public.driver_gamification (
  driver_id uuid primary key references public.drivers(user_id) on delete cascade,
  level_name text,
  bonus_points int not null default 0,
  total_trips int not null default 0,
  total_earnings_uzs bigint not null default 0,
  last_trip_date date,
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_missions (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  target_type text,
  target_value int,
  reward_points int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.mission_progress (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references public.daily_missions(id) on delete cascade,
  driver_id uuid references public.drivers(user_id) on delete cascade,
  progress_value int not null default 0,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(mission_id, driver_id)
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  brand text, model text, year int, plate text, color text, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.delivery_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  driver_user_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  service_mode text default 'city',
  status text default 'pending',
  parcel_type text,
  parcel_label text,
  weight_kg numeric(10,2) default 0,
  price bigint default 0,
  commission_amount bigint default 0,
  payment_method text,
  comment text,
  receiver_name text,
  receiver_phone text,
  sender_phone text,
  pickup_mode text,
  dropoff_mode text,
  pickup_region text,
  pickup_district text,
  pickup_label text,
  pickup_lat double precision,
  pickup_lng double precision,
  dropoff_region text,
  dropoff_district text,
  dropoff_label text,
  dropoff_lat double precision,
  dropoff_lng double precision,
  matched_trip_id uuid references public.interprov_trips(id) on delete set null,
  matched_trip_title text,
  matched_driver_user_id uuid references public.profiles(id) on delete set null,
  matched_driver_name text,
  history jsonb not null default '[]'::jsonb,
  pickup jsonb,
  dropoff jsonb,
  note text,
  price_uzs bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.parcels (
  id uuid primary key default gen_random_uuid(), order_id uuid, weight_kg numeric(10,2), volume_m3 numeric(10,2), note text, created_at timestamptz not null default now()
);

create table if not exists public.cargo_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  driver_user_id uuid references public.profiles(id) on delete set null,
  selected_offer_id uuid,
  status text default 'pending',
  title text,
  description text,
  cargo_type text,
  cargo_name text,
  weight_kg numeric(10,2),
  volume_m3 numeric(10,2),
  price_uzs bigint,
  budget bigint,
  pickup jsonb,
  dropoff jsonb,
  from_address text,
  to_address text,
  from_point text,
  to_point text,
  pickup_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.cargo_offers (
  id uuid primary key default gen_random_uuid(),
  cargo_order_id uuid references public.cargo_orders(id) on delete cascade,
  cargo_id uuid references public.cargo_orders(id) on delete cascade,
  driver_user_id uuid references public.profiles(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  price bigint,
  eta_minutes int,
  note text,
  status text default 'sent',
  created_at timestamptz not null default now()
);
create table if not exists public.cargo_status_events (
  id bigserial primary key,
  cargo_order_id uuid references public.cargo_orders(id) on delete cascade,
  cargo_id uuid references public.cargo_orders(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  status text,
  note text,
  created_at timestamptz not null default now()
);
create table if not exists public.cargo_tracking_points (
  id bigserial primary key,
  cargo_order_id uuid references public.cargo_orders(id) on delete cascade,
  cargo_id uuid references public.cargo_orders(id) on delete cascade,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);
create table if not exists public.cargo_ratings (
  id uuid primary key default gen_random_uuid(), cargo_order_id uuid references public.cargo_orders(id) on delete cascade, from_user_id uuid references public.profiles(id), to_user_id uuid references public.profiles(id), rating numeric(3,2), comment text, created_at timestamptz not null default now()
);

create table if not exists public.interprov_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  from_region text,
  to_region text,
  from_district text,
  to_district text,
  depart_at timestamptz,
  seat_price_uzs bigint,
  seats_total int,
  seats_available int,
  status text default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.inter_prov_seat_requests (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.interprov_trips(id) on delete cascade,
  user_id uuid references public.profiles(id),
  seats int not null default 1,
  notes text,
  hold_id text,
  status text default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.district_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  region text,
  from_district text,
  to_district text,
  tariff text,
  pitak_id uuid,
  from_point jsonb,
  to_point jsonb,
  meeting_points jsonb not null default '[]'::jsonb,
  route_polyline jsonb not null default '[]'::jsonb,
  depart_at timestamptz,
  seats_total int,
  allow_full_salon boolean not null default false,
  base_price_uzs bigint,
  pickup_fee_uzs bigint,
  dropoff_fee_uzs bigint,
  waiting_fee_uzs bigint,
  full_salon_price_uzs bigint,
  has_ac boolean not null default false,
  has_trunk boolean not null default false,
  is_lux boolean not null default false,
  allow_smoking boolean not null default false,
  has_delivery boolean not null default false,
  delivery_price_uzs bigint,
  notes text,
  women_only boolean not null default false,
  booking_mode text,
  status text default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.district_trip_requests (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.district_trips(id) on delete cascade,
  user_id uuid references public.profiles(id),
  seats_requested int,
  wants_full_salon boolean not null default false,
  pickup_address text,
  dropoff_address text,
  pickup_point jsonb,
  dropoff_point jsonb,
  meeting_point_id uuid,
  is_delivery boolean not null default false,
  delivery_notes text,
  weight_category text,
  payment_method text,
  final_price bigint,
  selected_seats jsonb not null default '[]'::jsonb,
  status text default 'pending',
  accepted_at timestamptz,
  rejected_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.district_pitaks (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.district_trips(id) on delete cascade,
  region text,
  from_district text,
  to_district text,
  title text,
  location_point jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.auto_garaj (
  id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id), car_name text, created_at timestamptz not null default now()
);
create table if not exists public.auto_service_books (
  id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id), vehicle_id uuid references public.vehicles(id) on delete set null, title text, created_at timestamptz not null default now()
);
create table if not exists public.auto_service_records (
  id uuid primary key default gen_random_uuid(), service_book_id uuid references public.auto_service_books(id) on delete cascade, note text, cost_uzs bigint, created_at timestamptz not null default now()
);

create table if not exists public.analytics_events ( id bigserial primary key, user_id uuid, name text, payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default now() );
create table if not exists public.activity_history ( id bigserial primary key, user_id uuid, event text, payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default now() );
create table if not exists public.app_config ( key text primary key, value jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now() );
create table if not exists public.api_rate_limits ( id uuid primary key default gen_random_uuid(), scope text, key text, counter int not null default 0, window_started_at timestamptz not null default now() );
create table if not exists public.device_fingerprints ( id uuid primary key default gen_random_uuid(), user_id uuid, fingerprint text, created_at timestamptz not null default now() );
create table if not exists public.fraud_flags ( id uuid primary key default gen_random_uuid(), user_id uuid, flag_code text, note text, created_at timestamptz not null default now() );
create table if not exists public.support_threads ( id uuid primary key default gen_random_uuid(), user_id uuid, title text, status text default 'open', created_at timestamptz not null default now() );
create table if not exists public.support_messages ( id uuid primary key default gen_random_uuid(), thread_id uuid references public.support_threads(id) on delete cascade, sender_user_id uuid, body text, created_at timestamptz not null default now() );
create table if not exists public.messages ( id uuid primary key default gen_random_uuid(), thread_id uuid, sender_user_id uuid, body text, created_at timestamptz not null default now() );
create table if not exists public.voip_call_logs ( id uuid primary key default gen_random_uuid(), caller_user_id uuid, callee_user_id uuid, status text, created_at timestamptz not null default now() );
create table if not exists public.payments_ledger_entries ( id uuid primary key default gen_random_uuid(), user_id uuid, reference_type text, reference_id uuid, direction text, amount_uzs bigint, created_at timestamptz not null default now() );
create table if not exists public.order_ratings ( id uuid primary key default gen_random_uuid(), order_id uuid references public.orders(id) on delete cascade, from_user_id uuid, to_user_id uuid, rating numeric(3,2), comment text, created_at timestamptz not null default now() );
create table if not exists public.driver_levels ( id uuid primary key default gen_random_uuid(), level_name text, min_trips int not null default 0, reward_points int not null default 0 );
create table if not exists public.sos_tickets ( id uuid primary key default gen_random_uuid(), user_id uuid, order_id uuid, status text default 'open', created_at timestamptz not null default now() );
create table if not exists public.traffic_zones ( id uuid primary key default gen_random_uuid(), title text, polygon jsonb, created_at timestamptz not null default now() );
create table if not exists public.demand_hotspots ( id uuid primary key default gen_random_uuid(), lat double precision, lng double precision, score numeric(10,2), created_at timestamptz not null default now() );
create table if not exists public.job_queue ( id uuid primary key default gen_random_uuid(), job_type text, payload jsonb not null default '{}'::jsonb, status text default 'queued', created_at timestamptz not null default now() );
create table if not exists public.idempotency_keys ( id uuid primary key default gen_random_uuid(), key text unique, payload_hash text, response jsonb, created_at timestamptz not null default now() );
create table if not exists public.driver_locations ( id uuid primary key default gen_random_uuid(), driver_id uuid references public.profiles(id), lat double precision, lng double precision, created_at timestamptz not null default now() );
create table if not exists public.avatars ( id uuid primary key default gen_random_uuid(), user_id uuid, image_url text, created_at timestamptz not null default now() );

commit;

alter table if exists public.support_threads add column if not exists order_id uuid references public.orders(id) on delete cascade;
alter table if exists public.support_threads add column if not exists driver_id uuid references public.profiles(id) on delete set null;
alter table if exists public.support_threads add column if not exists updated_at timestamptz not null default now();

alter table if exists public.support_messages add column if not exists sender_role text;
alter table if exists public.support_messages add column if not exists sender_id uuid references public.profiles(id) on delete set null;
alter table if exists public.support_messages add column if not exists message text;

alter table if exists public.messages add column if not exists order_id uuid references public.orders(id) on delete cascade;

alter table if exists public.order_ratings add column if not exists role text;
alter table if exists public.order_ratings add column if not exists stars int;

alter table if exists public.device_fingerprints add column if not exists device_hash text;
alter table if exists public.device_fingerprints add column if not exists platform text;
alter table if exists public.device_fingerprints add column if not exists first_seen timestamptz;
alter table if exists public.device_fingerprints add column if not exists last_seen timestamptz;
alter table if exists public.device_fingerprints add column if not exists meta jsonb not null default '{}'::jsonb;
create unique index if not exists idx_device_fingerprints_user_hash on public.device_fingerprints(user_id, device_hash);

alter table if exists public.fraud_flags add column if not exists entity_type text;
alter table if exists public.fraud_flags add column if not exists entity_id uuid;
alter table if exists public.fraud_flags add column if not exists score numeric(10,2);
alter table if exists public.fraud_flags add column if not exists reason text;
alter table if exists public.fraud_flags add column if not exists meta jsonb not null default '{}'::jsonb;

alter table if exists public.sos_tickets add column if not exists message text;
alter table if exists public.sos_tickets add column if not exists lat double precision;
alter table if exists public.sos_tickets add column if not exists lng double precision;


-- SOURCE: sql/04_orders_unified_contract.sql
-- Unified order contract hardening for city taxi and related services.
-- Safe additive migration: does not drop existing columns or tables.

create index if not exists idx_orders_user_active
  on public.orders (user_id, created_at desc)
  where status in ('draft','pending','searching','offered','accepted','arrived','in_progress','in_trip');

create index if not exists idx_orders_driver_active
  on public.orders (driver_id, created_at desc)
  where status in ('accepted','arrived','in_progress','in_trip');

create index if not exists idx_orders_service_status_created
  on public.orders (service_type, status, created_at desc);

create index if not exists idx_order_offers_active_sent
  on public.order_offers (order_id, status, expires_at)
  where status = 'sent';

create index if not exists idx_order_events_order_created
  on public.order_events (order_id, created_at desc);

comment on table public.orders is 'Unified orders table. Source of truth: orders.id, pickup jsonb, dropoff jsonb.';
comment on column public.orders.pickup is 'Unified pickup payload: { address, lat, lng, ... }';
comment on column public.orders.dropoff is 'Unified dropoff payload: { address, lat, lng, ... } or null';


-- SOURCE: sql/05_order_offer_hardening.sql
-- Phase 7: order offers + timeline hardening
create index if not exists idx_order_offers_order_sent_expires
on public.order_offers(order_id, status, expires_at desc);

create index if not exists idx_order_offers_driver_sent
on public.order_offers(driver_id, status, sent_at desc);

create index if not exists idx_order_events_order_code_created
on public.order_events(order_id, event_code, created_at desc);

create index if not exists idx_orders_searching_service_created
on public.orders(service_type, status, created_at desc)
where status in ('created','searching','offered');


-- SOURCE: sql/06_orders_permissions_and_policies.sql
begin;

alter table public.orders enable row level security;

grant usage on schema public to authenticated;
grant usage on schema public to service_role;
grant usage on schema public to anon;

grant select, insert, update, delete on table public.orders to authenticated;
grant select, insert, update, delete on table public.orders to service_role;
grant select on table public.orders to anon;

drop policy if exists "orders_select_own" on public.orders;
drop policy if exists "orders_insert_own" on public.orders;
drop policy if exists "orders_update_own" on public.orders;
drop policy if exists "orders_delete_own" on public.orders;
drop policy if exists "orders_select_own_or_assigned" on public.orders;
drop policy if exists "orders_insert_client" on public.orders;
drop policy if exists "orders_update_client_limited" on public.orders;
drop policy if exists "orders_select_client_or_driver" on public.orders;
drop policy if exists "orders_update_client_or_driver" on public.orders;
drop policy if exists "orders_delete_client" on public.orders;

create policy "orders_select_own_or_driver"
on public.orders
for select
to authenticated
using (user_id = auth.uid() or driver_id = auth.uid());

create policy "orders_insert_own"
on public.orders
for insert
to authenticated
with check (user_id = auth.uid());

create policy "orders_update_own_or_driver"
on public.orders
for update
to authenticated
using (user_id = auth.uid() or driver_id = auth.uid())
with check (user_id = auth.uid() or driver_id = auth.uid());

create policy "orders_delete_own"
on public.orders
for delete
to authenticated
using (user_id = auth.uid());


commit;


-- SOURCE: sql/07_driver_geo_index.sql
alter table public.drivers
add column if not exists location geography(point,4326);

alter table public.drivers
add column if not exists last_seen timestamptz;

create index if not exists idx_drivers_location
on public.drivers
using gist(location);

create index if not exists idx_drivers_last_seen
on public.drivers(last_seen desc);


-- SOURCE: sql/08_drivers_in_radius_function.sql
create or replace function public.drivers_in_radius(
 lat float,
 lng float,
 radius float
)
returns setof public.drivers
language sql
as $$
 select *
 from public.drivers
 where location is not null
   and ST_DWithin(
     location,
     ST_SetSRID(ST_MakePoint(lng,lat),4326)::geography,
     radius
   )
   and coalesce(last_seen, now() - interval '1 hour') > now() - interval '30 seconds';
$$;


-- SOURCE: sql/09_dispatch_metrics.sql
create table if not exists public.dispatch_metrics (
 id uuid primary key default gen_random_uuid(),
 order_id uuid,
 drivers_sent int default 0,
 accepted boolean default false,
 created_at timestamptz default now()
);

create index if not exists idx_dispatch_metrics_order
on public.dispatch_metrics(order_id);


-- SOURCE: sql/10_platform_intelligence.sql
create table if not exists public.driver_rating_votes (
 id uuid primary key default gen_random_uuid(),
 order_id uuid,
 driver_id uuid,
 user_id uuid,
 rating int check (rating >= 1 and rating <= 5),
 comment text,
 created_at timestamptz default now()
);

create table if not exists public.cancel_penalties (
 id uuid primary key default gen_random_uuid(),
 order_id uuid,
 actor_user_id uuid,
 actor_role text,
 penalty_uzs bigint not null default 0,
 reason text,
 created_at timestamptz default now()
);

create table if not exists public.fraud_flags (
 id uuid primary key default gen_random_uuid(),
 order_id uuid,
 user_id uuid,
 flags jsonb default '[]'::jsonb,
 created_at timestamptz default now()
);


-- SOURCE: sql/11_driver_earnings.sql
create table if not exists driver_earnings(
 id uuid primary key default gen_random_uuid(),
 driver_id uuid,
 order_id uuid,
 amount numeric,
 created_at timestamptz default now()
);


-- SOURCE: sql/12_driver_rating.sql
create table if not exists driver_ratings(
 id uuid primary key default gen_random_uuid(),
 driver_id uuid,
 order_id uuid,
 rating int,
 created_at timestamptz default now()
);


-- SOURCE: sql/13_admin_monitoring.sql
create table if not exists platform_monitoring(
 id uuid primary key default gen_random_uuid(),
 metric text,
 value numeric,
 created_at timestamptz default now()
);


-- SOURCE: sql/14_demand_heatmap.sql
create table if not exists demand_heatmap (
  id uuid primary key default gen_random_uuid(),
  area text,
  orders int default 0,
  drivers int default 0,
  surge_multiplier numeric default 1,
  created_at timestamptz default now()
);

create index if not exists idx_demand_heatmap_area_created_at
on demand_heatmap(area, created_at desc);


-- SOURCE: sql/15_phase14_enterprise.sql
create table if not exists driver_location_stream (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid,
  lat double precision,
  lng double precision,
  ts timestamptz default now()
);

create index if not exists idx_driver_location_stream_driver_ts
on driver_location_stream(driver_id, ts desc);

create table if not exists sos_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  order_id uuid,
  lat double precision,
  lng double precision,
  message text,
  created_at timestamptz default now()
);

create index if not exists idx_sos_alerts_order_created
on sos_alerts(order_id, created_at desc);

create table if not exists platform_metrics (
  id uuid primary key default gen_random_uuid(),
  metric text not null,
  value numeric,
  meta jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_platform_metrics_metric_created
on platform_metrics(metric, created_at desc);


-- SOURCE: sql/16_city_taxi_compat_patch.sql
-- Phase 16: city taxi compatibility patch for frontend/backend contract
-- Purpose:
-- 1) add compatibility columns used by the current taxi order API
-- 2) keep the unified orders table as the source of truth
-- 3) avoid repeated schema-cache errors for car_type/comment/distance_m/etc.

alter table public.orders
add column if not exists car_type text,
add column if not exists comment text,
add column if not exists distance_m integer,
add column if not exists duration_s integer,
add column if not exists surge_multiplier numeric(8,2) not null default 1,
add column if not exists options jsonb not null default '{}'::jsonb,
add column if not exists pickup_lat double precision,
add column if not exists pickup_lng double precision,
add column if not exists dropoff_lat double precision,
add column if not exists dropoff_lng double precision;

-- Keep denormalized compatibility columns in sync with pickup/dropoff jsonb.
update public.orders
set
  pickup_lat = coalesce(pickup_lat, nullif(pickup->>'lat','')::double precision),
  pickup_lng = coalesce(pickup_lng, nullif(pickup->>'lng','')::double precision),
  dropoff_lat = coalesce(dropoff_lat, nullif(dropoff->>'lat','')::double precision),
  dropoff_lng = coalesce(dropoff_lng, nullif(dropoff->>'lng','')::double precision),
  comment = coalesce(comment, note)
where true;

create or replace function public.sync_order_compat_columns()
returns trigger
language plpgsql
as $$
begin
  if new.pickup is not null then
    new.pickup_lat := coalesce(new.pickup_lat, nullif(new.pickup->>'lat','')::double precision);
    new.pickup_lng := coalesce(new.pickup_lng, nullif(new.pickup->>'lng','')::double precision);
  end if;

  if new.dropoff is not null then
    new.dropoff_lat := coalesce(new.dropoff_lat, nullif(new.dropoff->>'lat','')::double precision);
    new.dropoff_lng := coalesce(new.dropoff_lng, nullif(new.dropoff->>'lng','')::double precision);
  end if;

  if new.comment is null then
    new.comment := new.note;
  end if;

  if new.surge_multiplier is null then
    new.surge_multiplier := 1;
  end if;

  if new.options is null then
    new.options := '{}'::jsonb;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_orders_sync_compat_columns on public.orders;
create trigger trg_orders_sync_compat_columns
before insert or update on public.orders
for each row execute function public.sync_order_compat_columns();

create index if not exists idx_orders_car_type on public.orders(car_type);
create index if not exists idx_orders_distance_m on public.orders(distance_m);
create index if not exists idx_orders_pickup_coords on public.orders(pickup_lat, pickup_lng);
create index if not exists idx_orders_dropoff_coords on public.orders(dropoff_lat, dropoff_lng);

comment on column public.orders.car_type is 'Client taxi tariff: start | komfort | biznes';
comment on column public.orders.comment is 'Compatibility comment field used by the current taxi client. Mirrors note when missing.';
comment on column public.orders.distance_m is 'Compatibility distance in meters for current taxi order flow.';
comment on column public.orders.duration_s is 'Compatibility duration in seconds for current taxi order flow.';
comment on column public.orders.surge_multiplier is 'Dynamic tariff multiplier used by surge pricing.';
comment on column public.orders.options is 'Additional taxi options payload stored as jsonb.';


-- SOURCE: sql/17_unified_user_id_orders_patch.sql
begin;

-- Canonical ownership for orders is public.orders.user_id.
-- This migration permanently removes legacy client_id from the orders table.

update public.orders
set user_id = coalesce(user_id, client_id)
where user_id is null
  and client_id is not null;

alter table public.orders
alter column user_id set not null;

drop trigger if exists trg_orders_sync_user_identity on public.orders;
drop function if exists public.sync_orders_user_identity();

drop index if exists public.idx_orders_client;
drop index if exists public.idx_orders_client_active;

alter table public.orders
drop column if exists client_id;

comment on column public.orders.user_id is
'Canonical universal user identity for order owner. client_id has been removed.';

commit;


-- SOURCE: sql/19_trip_corridor_core.sql
create table if not exists public.trip_corridors (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  user_id uuid null,
  route_polyline jsonb not null default '[]'::jsonb,
  from_point jsonb null,
  to_point jsonb null,
  waypoint_points jsonb not null default '[]'::jsonb,
  max_detour_km numeric(8,2) not null default 8,
  pickup_radius_km numeric(8,2) not null default 3,
  dropoff_radius_km numeric(8,2) not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists trip_corridors_trip_id_idx on public.trip_corridors(trip_id);


-- SOURCE: sql/20_driver_presence_and_no_fake_market_fix.sql
-- UniGo production cleanup
-- 1) Approved driver application -> drivers row + driver_presence row
insert into public.drivers (
  user_id, application_id, transport_type, allowed_services, seat_count, max_freight_weight_kg, payload_volume_m3,
  vehicle_brand, vehicle_model, vehicle_year, vehicle_plate, vehicle_color, is_verified, is_active, is_suspended, approved_at, updated_at
)
select
  da.user_id,
  da.id,
  da.transport_type,
  case
    when da.transport_type = 'truck' then array['freight']::text[]
    when da.transport_type = 'bus_gazel' then array['delivery','inter_district','inter_city','freight']::text[]
    else array['taxi','delivery','inter_district','inter_city','freight']::text[]
  end,
  coalesce(da.seat_count, 0),
  coalesce(da.requested_max_freight_weight_kg, 0),
  coalesce(da.requested_payload_volume_m3, 0),
  da.vehicle_brand, da.vehicle_model, da.vehicle_year, da.vehicle_plate, da.vehicle_color,
  true, true, false, now(), now()
from public.driver_applications da
where da.status = 'approved'
on conflict (user_id) do update set
  application_id = excluded.application_id,
  transport_type = excluded.transport_type,
  allowed_services = excluded.allowed_services,
  seat_count = excluded.seat_count,
  max_freight_weight_kg = excluded.max_freight_weight_kg,
  payload_volume_m3 = excluded.payload_volume_m3,
  vehicle_brand = excluded.vehicle_brand,
  vehicle_model = excluded.vehicle_model,
  vehicle_year = excluded.vehicle_year,
  vehicle_plate = excluded.vehicle_plate,
  vehicle_color = excluded.vehicle_color,
  is_verified = true,
  is_active = true,
  is_suspended = false,
  approved_at = now(),
  updated_at = now();

insert into public.driver_presence (driver_id, is_online, state, created_at, updated_at)
select d.user_id, false, 'offline', now(), now()
from public.drivers d
on conflict (driver_id) do nothing;


-- SOURCE: sql/20_trip_inventory_holds.sql
create table if not exists public.trip_inventory_holds (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  user_id uuid null,
  seats integer not null default 1,
  hold_token text not null unique,
  status text not null default 'held',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists trip_inventory_holds_trip_id_idx on public.trip_inventory_holds(trip_id, status, expires_at);


-- SOURCE: sql/21_trip_recurring.sql
create table if not exists public.trip_recurring_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  service_type text not null default 'intercity',
  recurrence text not null default 'weekly',
  weekdays integer[] not null default '{}',
  departure_time text not null default '07:00',
  template_payload jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- SOURCE: sql/22_trip_waitlist_and_rank.sql
create table if not exists public.trip_waitlists (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  user_id uuid null,
  seats integer not null default 1,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.trip_ranking_signals (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  user_id uuid null,
  corridor_score numeric(8,2) not null default 0,
  reliability_score numeric(8,2) not null default 0,
  price_score numeric(8,2) not null default 0,
  amenity_score numeric(8,2) not null default 0,
  final_score numeric(8,2) not null default 0,
  created_at timestamptz not null default now()
);


-- SOURCE: sql/23_airport_transfer_and_amenities.sql
alter table if exists public.interprov_trips add column if not exists is_airport_transfer boolean not null default false;
alter table if exists public.interprov_trips add column if not exists flight_number text null;
alter table if exists public.interprov_trips add column if not exists arrival_time timestamptz null;
alter table if exists public.interprov_trips add column if not exists terminal text null;
alter table if exists public.interprov_trips add column if not exists waiting_policy jsonb not null default '{}'::jsonb;
alter table if exists public.interprov_trips add column if not exists amenities jsonb not null default '{}'::jsonb;
alter table if exists public.interprov_trips add column if not exists child_seat_types text[] not null default '{}';
alter table if exists public.interprov_trips add column if not exists wheelchair_accessible boolean not null default false;
alter table if exists public.interprov_trips add column if not exists meet_greet boolean not null default false;


-- SOURCE: sql/24_fleet_core.sql
create table if not exists public.fleets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  title text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.fleet_drivers (
  id uuid primary key default gen_random_uuid(),
  fleet_id uuid not null references public.fleets(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'driver',
  created_at timestamptz not null default now()
);
create table if not exists public.fleet_vehicles (
  id uuid primary key default gen_random_uuid(),
  fleet_id uuid not null references public.fleets(id) on delete cascade,
  vehicle_id uuid null,
  plate_number text null,
  title text null,
  created_at timestamptz not null default now()
);


-- SOURCE: sql/28_phase1_core_freeze_v2.sql
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


-- SOURCE: sql/29_phase2_table_classification.sql
-- UniGo 2-bosqich: jadval klassifikatsiyasi va legacy belgilash
-- Bu script hech narsani o‘chirmaydi.
-- Faqat metadata comment va helper view yaratadi.

create schema if not exists app_meta;

create table if not exists app_meta.table_classification (
  table_name text primary key,
  classification text not null check (classification in ('core', 'service_primary', 'legacy', 'drop_later')),
  service_scope text,
  keep_reason text,
  notes text,
  updated_at timestamptz not null default now()
);

create or replace function app_meta.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_table_classification_updated_at on app_meta.table_classification;
create trigger trg_table_classification_updated_at
before update on app_meta.table_classification
for each row
execute function app_meta.touch_updated_at();

insert into app_meta.table_classification(table_name, classification, service_scope, keep_reason, notes)
values
('profiles', 'core', 'global', 'Main user profile', 'Unified user id core table'),
('driver_applications', 'core', 'driver', 'Driver application lifecycle', 'Keep as main driver application table'),
('driver_documents', 'core', 'driver', 'Driver document storage', 'Keep as main driver documents table'),
('driver_service_settings', 'core', 'driver', 'Driver enabled service flags', 'Boolean service settings are canonical'),
('vehicles', 'core', 'driver', 'Approved driver vehicles', 'Active vehicle and capacity source'),
('vehicle_change_requests', 'core', 'driver', 'Vehicle add/update approval flow', 'Admin approval queue'),
('driver_presence', 'core', 'driver', 'Online/offline presence', 'Current online presence source'),
('wallets', 'core', 'wallet', 'Main wallet balance', 'Keep as canonical wallet'),
('wallet_transactions', 'core', 'wallet', 'Wallet transaction history', 'Keep as canonical wallet history'),
('orders', 'core', 'orders', 'Future unified order base', 'Keep as universal order backbone'),
('notifications', 'core', 'global', 'Notifications', 'Keep'),
('push_tokens', 'core', 'global', 'Push delivery tokens', 'Keep'),
('regions', 'core', 'geo', 'Geography', 'Keep'),
('districts', 'core', 'geo', 'Geography', 'Keep'),

('city_taxi_orders', 'service_primary', 'city', 'Current city taxi order source', 'Current service-primary table'),
('delivery_orders', 'service_primary', 'delivery', 'Current delivery order source', 'Current service-primary table'),
('cargo_orders', 'service_primary', 'freight', 'Current cargo order source', 'Current service-primary table'),
('cargo_offers', 'service_primary', 'freight', 'Current cargo offer source', 'Used by freight bidding flow'),
('cargo_feed', 'service_primary', 'freight', 'Freight feed data', 'Keep during migration'),
('cargo_status_events', 'service_primary', 'freight', 'Cargo event history', 'Keep during migration'),
('cargo_tracking_points', 'service_primary', 'freight', 'Cargo tracking points', 'Keep during migration'),
('cargo_ratings', 'service_primary', 'freight', 'Cargo ratings', 'Keep during migration'),
('district_trips', 'service_primary', 'interdistrict', 'Current district trip source', 'Current service-primary table'),
('district_trip_requests', 'service_primary', 'interdistrict', 'Current district request source', 'Current service-primary table'),
('district_bookings', 'service_primary', 'interdistrict', 'District booking layer', 'Keep during migration'),
('district_routes', 'service_primary', 'interdistrict', 'District routes', 'Keep during migration'),
('district_pitaks', 'service_primary', 'interdistrict', 'District pitak data', 'Keep during migration'),
('interprov_trips', 'service_primary', 'intercity', 'Current interprovincial trip source', 'Preferred trip table'),
('interprov_bookings', 'service_primary', 'intercity', 'Current interprovincial booking source', 'Preferred booking table'),
('inter_prov_seat_requests', 'service_primary', 'intercity', 'Seat request source', 'Current seat request table'),
('intercity_bookings', 'service_primary', 'intercity', 'Intercity booking layer', 'Keep during migration'),
('intercity_routes', 'service_primary', 'intercity', 'Intercity routes', 'Keep during migration'),

('drivers', 'legacy', 'driver', 'Duplicate/old driver table', 'Do not drop yet; likely replaced by profiles + driver_applications'),
('driver_profiles', 'legacy', 'driver', 'Duplicate/old driver profile layer', 'Do not drop yet; audit frontend usage first'),
('inter_prov_trips', 'legacy', 'intercity', 'Duplicate trip table', 'Likely duplicate of interprov_trips'),
('transactions', 'legacy', 'wallet', 'Old transaction layer', 'Audit before cleanup'),
('billing_transactions', 'legacy', 'wallet', 'Old billing layer', 'Audit before cleanup')
on conflict (table_name) do update
set classification = excluded.classification,
    service_scope = excluded.service_scope,
    keep_reason = excluded.keep_reason,
    notes = excluded.notes;

comment on table public.profiles is 'CORE: main user profile table';
comment on table public.driver_applications is 'CORE: main driver application table';
comment on table public.driver_documents is 'CORE: main driver documents table';
comment on table public.driver_service_settings is 'CORE: canonical driver service flags table';
comment on table public.vehicles is 'CORE: canonical driver vehicles table';
comment on table public.vehicle_change_requests is 'CORE: vehicle approval/change queue';
comment on table public.driver_presence is 'CORE: canonical driver online presence';
comment on table public.wallets is 'CORE: canonical wallet table';
comment on table public.wallet_transactions is 'CORE: canonical wallet transaction history';
comment on table public.orders is 'CORE: future unified orders backbone';

comment on table public.city_taxi_orders is 'SERVICE_PRIMARY: city taxi current source table';
comment on table public.delivery_orders is 'SERVICE_PRIMARY: delivery current source table';
comment on table public.cargo_orders is 'SERVICE_PRIMARY: freight current source table';
comment on table public.cargo_offers is 'SERVICE_PRIMARY: freight offers current source table';
comment on table public.district_trips is 'SERVICE_PRIMARY: interdistrict current source table';
comment on table public.district_trip_requests is 'SERVICE_PRIMARY: interdistrict request source table';
comment on table public.interprov_trips is 'SERVICE_PRIMARY: intercity preferred trip source';
comment on table public.interprov_bookings is 'SERVICE_PRIMARY: intercity preferred booking source';
comment on table public.inter_prov_seat_requests is 'SERVICE_PRIMARY: intercity seat request source';
comment on table public.intercity_bookings is 'SERVICE_PRIMARY: intercity booking layer kept during migration';

comment on table public.drivers is 'LEGACY: duplicate/old driver table. Do not drop before audit';
comment on table public.driver_profiles is 'LEGACY: duplicate/old driver profile table. Do not drop before audit';
comment on table public.interprov_trips is 'LEGACY: likely duplicate of interprov_trips. Audit before cleanup';
comment on table public.transactions is 'LEGACY: old transaction table. Audit before cleanup';
comment on table public.billing_transactions is 'LEGACY: old billing transaction table. Audit before cleanup';

create or replace view app_meta.v_table_classification as
select
  tc.table_name,
  tc.classification,
  tc.service_scope,
  tc.keep_reason,
  tc.notes,
  t.table_type
from app_meta.table_classification tc
left join information_schema.tables t
  on t.table_schema = 'public'
 and t.table_name = tc.table_name
order by
  case tc.classification
    when 'core' then 1
    when 'service_primary' then 2
    when 'legacy' then 3
    when 'drop_later' then 4
    else 5
  end,
  tc.table_name;


-- SOURCE: sql/30_phase3_service_dependency_map.sql
-- UniGo 3-bosqich: frontend/backend mapping metadata
-- Bu script data o'chirmaydi. Faqat mapping metadata yaratadi.

create schema if not exists app_meta;

create table if not exists app_meta.service_dependency_map (
  id bigserial primary key,
  layer text not null check (layer in ('frontend', 'backend', 'core', 'service')),
  component_name text not null,
  canonical_table text not null,
  secondary_tables text[],
  service_scope text,
  write_mode text,
  read_mode text,
  notes text,
  updated_at timestamptz not null default now()
);

create or replace function app_meta.touch_service_dependency_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_service_dependency_map_updated_at on app_meta.service_dependency_map;
create trigger trg_service_dependency_map_updated_at
before update on app_meta.service_dependency_map
for each row
execute function app_meta.touch_service_dependency_updated_at();

delete from app_meta.service_dependency_map
where component_name in (
  'DriverDashboard',
  'DriverSettingsPage',
  'VehiclesPage',
  'DriverHome',
  'DriverDelivery',
  'DriverFreight',
  'InterDistrictPage',
  'InterProvincialPage',
  'CityTaxiFlow',
  'DeliveryFlow',
  'FreightFlow',
  'InterdistrictFlow',
  'IntercityFlow'
);

insert into app_meta.service_dependency_map
(layer, component_name, canonical_table, secondary_tables, service_scope, write_mode, read_mode, notes)
values
('frontend', 'DriverDashboard', 'profiles', ARRAY['driver_service_settings','vehicles','driver_presence'], 'driver', 'read_only', 'core_read', 'Dashboard only reads driver core state'),
('frontend', 'DriverSettingsPage', 'driver_service_settings', ARRAY['profiles','vehicles','vehicle_change_requests'], 'driver', 'update', 'core_read_write', 'Driver settings source of truth'),
('frontend', 'VehiclesPage', 'vehicles', ARRAY['vehicle_change_requests','profiles'], 'driver', 'request_write', 'core_read_write', 'Vehicles and active vehicle selection'),
('frontend', 'DriverHome', 'profiles', ARRAY['driver_service_settings','vehicles','driver_presence'], 'driver', 'presence_update', 'core_read', 'Home uses only driver core'),
('frontend', 'DriverDelivery', 'delivery_orders', ARRAY['profiles','driver_service_settings','vehicles'], 'delivery', 'service_write', 'service_primary', 'Delivery reads delivery_orders but capability from driver core'),
('frontend', 'DriverFreight', 'cargo_orders', ARRAY['cargo_offers','cargo_feed','profiles','driver_service_settings','vehicles'], 'freight', 'service_write', 'service_primary', 'Freight reads cargo tables but capability from driver core'),
('frontend', 'InterDistrictPage', 'district_trips', ARRAY['district_trip_requests','district_bookings','profiles','driver_service_settings','vehicles'], 'interdistrict', 'service_write', 'service_primary', 'Interdistrict reads district service tables'),
('frontend', 'InterProvincialPage', 'interprov_trips', ARRAY['interprov_bookings','inter_prov_seat_requests','intercity_bookings','profiles','driver_service_settings','vehicles'], 'intercity', 'service_write', 'service_primary', 'Intercity reads canonical interprov tables'),
('backend', 'CityTaxiFlow', 'city_taxi_orders', ARRAY['orders'], 'city', 'service_write', 'service_primary', 'Orders may later unify into orders'),
('backend', 'DeliveryFlow', 'delivery_orders', ARRAY['orders'], 'delivery', 'service_write', 'service_primary', 'Delivery remains on delivery_orders during migration'),
('backend', 'FreightFlow', 'cargo_orders', ARRAY['cargo_offers','cargo_feed','cargo_status_events','cargo_tracking_points'], 'freight', 'service_write', 'service_primary', 'Freight remains on cargo tables during migration'),
('backend', 'InterdistrictFlow', 'district_trips', ARRAY['district_trip_requests','district_bookings','district_routes','district_pitaks'], 'interdistrict', 'service_write', 'service_primary', 'Interdistrict remains on district tables during migration'),
('backend', 'IntercityFlow', 'interprov_trips', ARRAY['interprov_bookings','inter_prov_seat_requests','intercity_bookings','intercity_routes'], 'intercity', 'service_write', 'service_primary', 'Intercity remains on interprov tables during migration');

create or replace view app_meta.v_service_dependency_map as
select
  layer,
  component_name,
  canonical_table,
  secondary_tables,
  service_scope,
  write_mode,
  read_mode,
  notes
from app_meta.service_dependency_map
order by
  case layer when 'frontend' then 1 when 'backend' then 2 when 'core' then 3 when 'service' then 4 else 5 end,
  component_name;

create or replace view app_meta.v_legacy_cutover_plan as
select *
from (
  values
    ('drivers', 'profiles + driver_applications', 'Stop frontend reads first, then stop backend writes, then drop later'),
    ('driver_profiles', 'profiles', 'Move any remaining profile reads to profiles, then mark legacy dead'),
    ('inter_prov_trips', 'interprov_trips', 'Replace all reads/writes with interprov_trips before cleanup'),
    ('transactions', 'wallet_transactions', 'Stop wallet UI and ledger reads from transactions first'),
    ('billing_transactions', 'wallet_transactions', 'Move billing history UI to wallet_transactions or dedicated billing layer')
) as t(legacy_table, replacement, cutover_steps);


-- SOURCE: sql/32_phase7_dispatch_engine.sql
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
    (earth_distance(ll_to_earth(p_lat, p_lng), ll_to_earth(dp.lat, dp.lng)) / 1000.0)::numeric as distance_km
  from public.driver_presence dp
  where dp.is_online = true
    and dp.lat is not null
    and dp.lng is not null
    and dp.geo_point is not null
    and earth_box(ll_to_earth(p_lat, p_lng), p_radius_km * 1000) @> ll_to_earth(dp.lat, dp.lng)
    and earth_distance(ll_to_earth(p_lat, p_lng), ll_to_earth(dp.lat, dp.lng)) <= p_radius_km * 1000;
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


-- SOURCE: sql/33_phase8_driver_metrics.sql
create table if not exists driver_metrics (
  driver_id uuid primary key,
  rating numeric default 5,
  acceptance_rate numeric default 0.8,
  priority numeric default 0.5,
  updated_at timestamptz default now()
);


-- SOURCE: sql/34_phase9_geo_index.sql
-- Phase 9: Geo index for drivers

create extension if not exists cube;
create extension if not exists earthdistance;

alter table if exists driver_presence
add column if not exists geo_point point;

update driver_presence
set geo_point = point(lng,lat)
where lat is not null and lng is not null;

create index if not exists idx_driver_geo
on driver_presence using gist(geo_point);


-- SOURCE: sql/35_phase10_demand_heatmap.sql
create table if not exists demand_heatmap (
  id uuid primary key default gen_random_uuid(),
  lat numeric,
  lng numeric,
  demand_score numeric default 0,
  updated_at timestamptz default now()
);


-- SOURCE: sql/36_phase11_driver_rating.sql
create table if not exists driver_rating (
 id uuid primary key default gen_random_uuid(),
 driver_id uuid,
 rating numeric,
 created_at timestamptz default now()
);


-- SOURCE: sql/37_phase11_driver_earnings.sql
create table if not exists driver_earnings (
 id uuid primary key default gen_random_uuid(),
 driver_id uuid,
 order_id uuid,
 amount numeric,
 created_at timestamptz default now()
);


-- SOURCE: sql/38_phase12_wave_dispatch.sql
create table if not exists dispatch_waves (
 id uuid primary key default gen_random_uuid(),
 order_id uuid,
 wave_index int,
 created_at timestamptz default now()
);


-- SOURCE: sql/39_phase13_dispatch_events.sql
create table if not exists dispatch_events (
 id uuid primary key default gen_random_uuid(),
 order_id uuid,
 driver_id uuid,
 event_type text,
 created_at timestamptz default now()
);


-- SOURCE: sql/40_phase14_surge_zones.sql
create table if not exists surge_zones (
 id uuid primary key default gen_random_uuid(),
 lat numeric,
 lng numeric,
 multiplier numeric default 1.0,
 updated_at timestamptz default now()
);


-- SOURCE: sql/41_phase15_ai_demand_prediction.sql
begin;

create table if not exists public.dispatch_demand_predictions (
  id uuid primary key default gen_random_uuid(),
  service_type text not null default 'taxi',
  region_key text not null,
  predicted_orders integer not null default 0,
  predicted_drivers_needed integer not null default 0,
  confidence numeric(5,4) not null default 0.5000,
  prediction_window_minutes integer not null default 30,
  source text not null default 'heuristic_ai_v1',
  created_at timestamptz not null default now(),
  unique(service_type, region_key, prediction_window_minutes, created_at)
);

create index if not exists idx_dispatch_demand_predictions_lookup
on public.dispatch_demand_predictions(service_type, region_key, created_at desc);

create table if not exists public.driver_reposition_tasks (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null,
  service_type text not null default 'taxi',
  target_region_key text not null,
  reason text not null default 'predicted_demand',
  priority numeric(10,4) not null default 0,
  status text not null default 'pending',
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_driver_reposition_tasks_driver_status
on public.driver_reposition_tasks(driver_id, status, created_at desc);

commit;


-- SOURCE: sql/43_phase17_fraud_detection.sql
create table if not exists fraud_flags (
 id uuid primary key default gen_random_uuid(),
 user_id uuid,
 reason text,
 score numeric,
 created_at timestamptz default now()
);


-- SOURCE: sql/44_phase19_predictive_surge.sql
create table if not exists predictive_surge_zones (
 id uuid primary key default gen_random_uuid(),
 region_key text,
 predicted_multiplier numeric default 1,
 created_at timestamptz default now()
);


-- SOURCE: sql/45_phase20_global_dispatch.sql
create table if not exists dispatch_clusters (
 id uuid primary key default gen_random_uuid(),
 region_key text,
 worker_group text,
 created_at timestamptz default now()
);

create table if not exists dispatch_job_queue (
 id uuid primary key default gen_random_uuid(),
 order_id uuid,
 payload jsonb,
 status text default 'pending',
 created_at timestamptz default now()
);

create index if not exists idx_dispatch_job_queue_status
on dispatch_job_queue(status);


-- SOURCE: sql/46_phase21_multicity.sql
create table if not exists cities (
 id uuid primary key default gen_random_uuid(),
 name text,
 region_code text,
 created_at timestamptz default now()
);

alter table orders add column if not exists city_id uuid;
alter table driver_presence add column if not exists city_id uuid;


-- SOURCE: sql/47_phase22_queue_metrics.sql
create table if not exists queue_metrics (
 id uuid primary key default gen_random_uuid(),
 queue_name text,
 jobs_pending int,
 jobs_processing int,
 created_at timestamptz default now()
);


-- SOURCE: sql/48_phase23_route_cache.sql
create table if not exists route_cache (
 id uuid primary key default gen_random_uuid(),
 origin text,
 destination text,
 distance_km numeric,
 eta_min int,
 created_at timestamptz default now()
);


-- SOURCE: sql/49_phase24_driver_distribution.sql
create table if not exists driver_distribution_predictions (
 id uuid primary key default gen_random_uuid(),
 region_key text,
 drivers_needed int,
 created_at timestamptz default now()
);


-- SOURCE: sql/50_phase25_service_registry.sql
create table if not exists service_registry (
 id uuid primary key default gen_random_uuid(),
 service_key text,
 dispatch_pipeline text,
 created_at timestamptz default now()
);


-- SOURCE: sql/51_phase26_redis_dispatch_cluster.sql
create table if not exists redis_dispatch_cluster_nodes (
  id uuid primary key default gen_random_uuid(),
  node_key text not null,
  host text,
  port integer,
  role text default 'worker',
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists redis_dispatch_queue_state (
  id uuid primary key default gen_random_uuid(),
  queue_name text not null,
  pending_count integer default 0,
  processing_count integer default 0,
  failed_count integer default 0,
  updated_at timestamptz default now()
);

create index if not exists idx_redis_dispatch_queue_state_name
on redis_dispatch_queue_state(queue_name, updated_at desc);


-- SOURCE: sql/52_phase27_worker_autoscaling.sql
create table if not exists worker_autoscaling_state (
  id uuid primary key default gen_random_uuid(),
  worker_group text not null,
  min_workers integer default 1,
  max_workers integer default 10,
  current_workers integer default 1,
  queue_depth integer default 0,
  cpu_load numeric default 0,
  updated_at timestamptz default now()
);

create index if not exists idx_worker_autoscaling_state_group
on worker_autoscaling_state(worker_group, updated_at desc);


-- SOURCE: sql/53_phase28_observability.sql
create table if not exists observability_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_name text not null,
  metric_value numeric not null default 0,
  labels jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_observability_metrics_name_created
on observability_metrics(metric_name, created_at desc);


-- SOURCE: sql/54_phase29_rate_limiting.sql
create table if not exists api_rate_limits (
  id uuid primary key default gen_random_uuid(),
  actor_key text not null,
  route_key text not null,
  request_count integer default 0,
  window_started_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(actor_key, route_key)
);

create index if not exists idx_api_rate_limits_route
on api_rate_limits(route_key, updated_at desc);


-- SOURCE: sql/55_phase30_event_streaming.sql
create table if not exists event_stream (
  id uuid primary key default gen_random_uuid(),
  stream_type text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_event_stream_type_created
on event_stream(stream_type, created_at desc);


-- SOURCE: sql/56_phase31_fleet_system.sql
create table if not exists fleet_owners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  company_name text,
  created_at timestamptz default now()
);

create table if not exists fleet_drivers (
  id uuid primary key default gen_random_uuid(),
  fleet_owner_id uuid references fleet_owners(id) on delete cascade,
  driver_id uuid not null,
  status text default 'active',
  created_at timestamptz default now(),
  unique(fleet_owner_id, driver_id)
);

create table if not exists fleet_commissions (
  id uuid primary key default gen_random_uuid(),
  fleet_owner_id uuid references fleet_owners(id) on delete cascade,
  service_type text not null default 'taxi',
  commission_rate numeric default 0.10,
  created_at timestamptz default now()
);

create table if not exists fleet_wallets (
  id uuid primary key default gen_random_uuid(),
  fleet_owner_id uuid references fleet_owners(id) on delete cascade,
  balance numeric default 0,
  updated_at timestamptz default now(),
  unique(fleet_owner_id)
);


-- SOURCE: sql/57_phase32_partner_ecosystem.sql
create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  partner_type text not null,
  company_name text not null,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists partner_api_keys (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references partners(id) on delete cascade,
  api_key text not null,
  status text default 'active',
  created_at timestamptz default now(),
  unique(api_key)
);

create table if not exists partner_webhooks (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references partners(id) on delete cascade,
  webhook_url text not null,
  event_type text not null,
  created_at timestamptz default now()
);


-- SOURCE: sql/58_phase33_dynamic_pricing.sql
create table if not exists pricing_snapshots (
  id uuid primary key default gen_random_uuid(),
  service_type text not null,
  base_price numeric default 0,
  demand_multiplier numeric default 1,
  traffic_multiplier numeric default 1,
  final_multiplier numeric default 1,
  created_at timestamptz default now()
);


-- SOURCE: sql/59_phase34_financial_ledger.sql
create table if not exists ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  account_key text not null unique,
  account_type text not null,
  created_at timestamptz default now()
);

create table if not exists ledger_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid default gen_random_uuid(),
  account_id uuid references ledger_accounts(id) on delete cascade,
  entry_type text not null,
  amount numeric not null,
  reference_type text,
  reference_id uuid,
  created_at timestamptz default now()
);

create index if not exists idx_ledger_entries_transaction
on ledger_entries(transaction_id, created_at);


-- SOURCE: sql/60_phase35_settlement_engine.sql
create table if not exists settlement_batches (
  id uuid primary key default gen_random_uuid(),
  batch_type text not null,
  status text default 'pending',
  total_amount numeric default 0,
  created_at timestamptz default now()
);

create table if not exists settlement_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references settlement_batches(id) on delete cascade,
  recipient_type text not null,
  recipient_id uuid,
  amount numeric default 0,
  status text default 'pending',
  created_at timestamptz default now()
);


-- SOURCE: sql/61_phase36_demand_forecast.sql
create table if not exists demand_forecasts (
 id uuid primary key default gen_random_uuid(),
 region_key text,
 predicted_orders int,
 prediction_window_minutes int default 30,
 created_at timestamptz default now()
);


-- SOURCE: sql/62_phase37_driver_supply.sql
create table if not exists driver_supply_predictions (
 id uuid primary key default gen_random_uuid(),
 region_key text,
 drivers_required int,
 created_at timestamptz default now()
);


-- SOURCE: sql/63_phase38_dynamic_surge.sql
create table if not exists surge_predictions (
 id uuid primary key default gen_random_uuid(),
 region_key text,
 surge_multiplier numeric default 1,
 created_at timestamptz default now()
);


-- SOURCE: sql/64_phase39_fraud_detection.sql
create table if not exists fraud_events (
 id uuid primary key default gen_random_uuid(),
 actor_id uuid,
 event_type text,
 risk_score numeric default 0,
 created_at timestamptz default now()
);


-- SOURCE: sql/65_phase40_global_regions.sql
create table if not exists global_regions (
 id uuid primary key default gen_random_uuid(),
 region_code text,
 region_name text,
 created_at timestamptz default now()
);

create table if not exists region_routing (
 id uuid primary key default gen_random_uuid(),
 region_code text,
 dispatch_cluster text,
 created_at timestamptz default now()
);


-- SOURCE: sql/66_phase41_wave_geo_optimizations.sql
begin;

create extension if not exists cube;
create extension if not exists earthdistance;

create table if not exists public.dispatch_wave_offers (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  driver_id uuid not null,
  wave_index integer not null default 1,
  offer_status text not null default 'sent',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique(order_id, driver_id, wave_index)
);

create index if not exists idx_dispatch_wave_offers_order_wave
on public.dispatch_wave_offers(order_id, wave_index, offer_status);

create table if not exists public.driver_location_snapshots (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null,
  lat double precision not null,
  lng double precision not null,
  source text not null default 'redis_geo_sync',
  created_at timestamptz not null default now()
);

create index if not exists idx_driver_location_snapshots_driver_created
on public.driver_location_snapshots(driver_id, created_at desc);

commit;


-- SOURCE: sql/supabase_driver_documents.sql
create extension if not exists pgcrypto;

alter table public.driver_applications
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists status text default 'pending',
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists father_name text,
  add column if not exists phone text,
  add column if not exists transport_type text,
  add column if not exists vehicle_brand text,
  add column if not exists vehicle_model text,
  add column if not exists vehicle_year integer,
  add column if not exists vehicle_plate text,
  add column if not exists vehicle_color text,
  add column if not exists seat_count integer,
  add column if not exists requested_max_freight_weight_kg numeric(10,2),
  add column if not exists requested_payload_volume_m3 numeric(10,2),
  add column if not exists can_luggage boolean default false,
  add column if not exists passport_number text,
  add column if not exists driver_license_number text,
  add column if not exists tech_passport_number text,
  add column if not exists rejection_reason text,
  add column if not exists admin_note text,
  add column if not exists submitted_at timestamptz default now(),
  add column if not exists reviewed_at timestamptz,
  add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_driver_applications_user_id on public.driver_applications(user_id);

create table if not exists public.driver_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.driver_applications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  doc_type text not null,
  file_path text not null,
  file_url text,
  file_name text,
  file_size bigint,
  mime_type text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists driver_documents_application_doc_type_idx on public.driver_documents(application_id, doc_type);
create index if not exists idx_driver_documents_user_id on public.driver_documents(user_id, created_at desc);

alter table public.driver_applications enable row level security;
alter table public.driver_documents enable row level security;

drop policy if exists driver_applications_select_own on public.driver_applications;
create policy driver_applications_select_own on public.driver_applications for select to authenticated using (user_id = auth.uid());
drop policy if exists driver_applications_insert_own on public.driver_applications;
create policy driver_applications_insert_own on public.driver_applications for insert to authenticated with check (user_id = auth.uid());
drop policy if exists driver_applications_update_own on public.driver_applications;
create policy driver_applications_update_own on public.driver_applications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists driver_documents_select_own on public.driver_documents;
create policy driver_documents_select_own on public.driver_documents for select to authenticated using (user_id = auth.uid());
drop policy if exists driver_documents_insert_own on public.driver_documents;
create policy driver_documents_insert_own on public.driver_documents for insert to authenticated with check (user_id = auth.uid());
drop policy if exists driver_documents_update_own on public.driver_documents;
create policy driver_documents_update_own on public.driver_documents for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into storage.buckets (id, name, public) values ('driver-documents', 'driver-documents', true) on conflict (id) do nothing;

drop policy if exists driver_docs_read_own on storage.objects;
create policy driver_docs_read_own on storage.objects for select to authenticated using (bucket_id = 'driver-documents' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists driver_docs_insert_own on storage.objects;
create policy driver_docs_insert_own on storage.objects for insert to authenticated with check (bucket_id = 'driver-documents' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists driver_docs_update_own on storage.objects;
create policy driver_docs_update_own on storage.objects for update to authenticated using (bucket_id = 'driver-documents' and auth.uid()::text = (storage.foldername(name))[1]) with check (bucket_id = 'driver-documents' and auth.uid()::text = (storage.foldername(name))[1]);


commit;

-- Final hard cleanup for unified identity
alter table if exists public.orders drop column if exists client_id;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'driver_rating_votes'
      and column_name = 'client_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'driver_rating_votes'
      and column_name = 'user_id'
  ) then
    execute 'alter table public.driver_rating_votes rename column client_id to user_id';
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'inter_prov_seat_requests'
      and column_name = 'client_user_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'inter_prov_seat_requests'
      and column_name = 'user_id'
  ) then
    execute 'alter table public.inter_prov_seat_requests rename column client_user_id to user_id';
  end if;
end $$;

comment on table public.profiles is 'Canonical identity table. profiles.id always equals auth.users.id.';
comment on column public.orders.user_id is 'Canonical order owner identity. No legacy client_id remains.';
comment on column public.inter_prov_seat_requests.user_id is 'Canonical client identity for seat requests.';


-- SOURCE: sql/46_unified_identity_bonus_referral_hardening.sql
-- Canonical hardening for single phone -> single account and unified bonus/referral flow.

create or replace function public.normalize_uz_phone(input_phone text)
returns text
language plpgsql
immutable
as $$
declare
  digits text;
begin
  if input_phone is null then
    return null;
  end if;

  digits := regexp_replace(trim(input_phone), '[^0-9]+', '', 'g');

  if digits = '' then
    return null;
  end if;

  if left(digits, 3) = '998' and length(digits) = 12 then
    return '+' || digits;
  elsif length(digits) = 9 then
    return '+998' || digits;
  elsif left(digits, 1) = '0' and length(digits) = 10 then
    return '+998' || right(digits, 9);
  else
    return case when left(trim(input_phone), 1) = '+' then trim(input_phone) else '+' || digits end;
  end if;
end;
$$;

alter table if exists public.profiles add column if not exists phone_normalized text;
update public.profiles
set phone_normalized = public.normalize_uz_phone(phone)
where coalesce(phone, '') <> ''
  and coalesce(phone_normalized, '') is distinct from public.normalize_uz_phone(phone);

create unique index if not exists idx_profiles_phone_normalized_unique
  on public.profiles(phone_normalized)
  where phone_normalized is not null;

create or replace function public.profiles_fill_phone_normalized()
returns trigger
language plpgsql
as $$
begin
  new.phone_normalized := public.normalize_uz_phone(coalesce(new.phone_normalized, new.phone));
  return new;
end;
$$;

drop trigger if exists trg_profiles_fill_phone_normalized on public.profiles;
create trigger trg_profiles_fill_phone_normalized
before insert or update on public.profiles
for each row execute function public.profiles_fill_phone_normalized();

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('client','driver','both','admin','courier','freight_driver','seller')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, role)
);

create index if not exists idx_user_roles_user on public.user_roles(user_id, is_active);

drop trigger if exists trg_user_roles_touch_updated_at on public.user_roles;
create trigger trg_user_roles_touch_updated_at
before update on public.user_roles
for each row execute function public.touch_updated_at();

alter table if exists public.wallets add column if not exists bonus_balance_uzs bigint not null default 0;

alter table if exists public.wallet_transactions
  drop constraint if exists wallet_transactions_kind_check;
alter table if exists public.wallet_transactions
  add constraint wallet_transactions_kind_check
  check (kind in ('topup','withdraw','order_payment','order_payout','commission','refund','ad_fee','manual_adjustment','spend','bonus','referral_bonus','promo_bonus','mission_bonus','loyalty_bonus'));

create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id),
  unique(code)
);

create index if not exists idx_referral_codes_code on public.referral_codes(code) where is_active = true;

drop trigger if exists trg_referral_codes_touch_updated_at on public.referral_codes;
create trigger trg_referral_codes_touch_updated_at
before update on public.referral_codes
for each row execute function public.touch_updated_at();

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.profiles(id) on delete cascade,
  referred_user_id uuid not null references public.profiles(id) on delete cascade,
  referral_code_id uuid not null references public.referral_codes(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','qualified','rewarded','rejected')),
  qualified_order_id uuid references public.orders(id) on delete set null,
  qualified_at timestamptz,
  rewarded_at timestamptz,
  fraud_score numeric(10,2) not null default 0,
  rejection_reason text,
  ip_address text,
  device_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(referred_user_id)
);

create index if not exists idx_referrals_referrer on public.referrals(referrer_user_id, created_at desc);
create index if not exists idx_referrals_status on public.referrals(status, created_at desc);

drop trigger if exists trg_referrals_touch_updated_at on public.referrals;
create trigger trg_referrals_touch_updated_at
before update on public.referrals
for each row execute function public.touch_updated_at();

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.referrals(id) on delete cascade,
  reward_user_id uuid not null references public.profiles(id) on delete cascade,
  reward_type text not null check (reward_type in ('referrer','referred')),
  amount_uzs bigint not null check (amount_uzs > 0),
  wallet_transaction_id uuid references public.wallet_transactions(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(referral_id, reward_user_id, reward_type)
);

create table if not exists public.bonus_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  campaign_type text not null check (campaign_type in ('referral','first_ride','loyalty','peak_hour','driver_milestone','promo')),
  audience_type text not null default 'client' check (audience_type in ('client','driver','both')),
  city_id uuid,
  service_type text,
  reward_type text not null default 'fixed_amount' check (reward_type in ('fixed_amount','percentage')),
  reward_amount_uzs bigint,
  reward_percent numeric(10,2),
  max_discount_uzs bigint,
  min_order_amount_uzs bigint not null default 0,
  usage_limit_total bigint,
  usage_limit_per_user bigint,
  stackable boolean not null default false,
  priority int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bonus_rules (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.bonus_campaigns(id) on delete cascade,
  trigger_event text not null,
  condition_type text not null,
  comparison_operator text not null default '>=' check (comparison_operator in ('=','>=','<=','>','<')),
  condition_value text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_bonus_usages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  campaign_id uuid not null references public.bonus_campaigns(id) on delete cascade,
  times_used bigint not null default 0,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, campaign_id)
);

drop trigger if exists trg_user_bonus_usages_touch_updated_at on public.user_bonus_usages;
create trigger trg_user_bonus_usages_touch_updated_at
before update on public.user_bonus_usages
for each row execute function public.touch_updated_at();

create table if not exists public.bonus_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id uuid references public.profiles(id) on delete cascade,
  related_user_id uuid references public.profiles(id) on delete set null,
  source_id uuid,
  source_type text,
  payload_json jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','done','failed')),
  attempt_count int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_bonus_events_status_created on public.bonus_events(status, created_at);

create table if not exists public.reward_locks (
  id uuid primary key default gen_random_uuid(),
  reward_key text not null unique,
  reward_type text not null,
  source_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text,
  description text,
  discount_type text not null default 'fixed' check (discount_type in ('fixed','percent')),
  discount_value numeric(12,2) not null,
  max_discount_uzs bigint,
  min_order_amount_uzs bigint not null default 0,
  usage_limit_total bigint,
  usage_limit_per_user bigint,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_promo_codes_touch_updated_at on public.promo_codes;
create trigger trg_promo_codes_touch_updated_at
before update on public.promo_codes
for each row execute function public.touch_updated_at();

create table if not exists public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid not null references public.promo_codes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  discount_uzs bigint not null check (discount_uzs >= 0),
  status text not null default 'applied' check (status in ('applied','reverted','expired')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(order_id)
);

create index if not exists idx_promo_redemptions_user on public.promo_redemptions(user_id, created_at desc);

create or replace function public.generate_referral_code(seed_text text)
returns text
language plpgsql
volatile
as $$
declare
  cleaned text;
  candidate text;
begin
  cleaned := upper(regexp_replace(coalesce(seed_text, 'UNI'), '[^A-Za-z0-9]+', '', 'g'));
  candidate := left(cleaned || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)), 10);
  return candidate;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
  v_role text;
begin
  v_phone := coalesce(new.phone, new.raw_user_meta_data ->> 'phone');
  v_role := coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'client');

  insert into public.profiles (id, phone, phone_normalized, full_name, metadata)
  values (
    new.id,
    v_phone,
    public.normalize_uz_phone(v_phone),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data, '{}'::jsonb)
  )
  on conflict (id) do update
    set phone = excluded.phone,
        phone_normalized = excluded.phone_normalized,
        metadata = case
          when public.profiles.metadata = '{}'::jsonb then excluded.metadata
          else public.profiles.metadata
        end;

  insert into public.wallets (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_roles (user_id, role, is_active)
  values (new.id, v_role, true)
  on conflict (user_id, role) do nothing;

  insert into public.referral_codes (user_id, code, is_active)
  values (
    new.id,
    public.generate_referral_code(coalesce(public.normalize_uz_phone(v_phone), new.id::text)),
    true
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

insert into public.bonus_campaigns (
  name,
  campaign_type,
  audience_type,
  reward_type,
  reward_amount_uzs,
  min_order_amount_uzs,
  is_active,
  metadata
)
select 'Default First Ride Bonus', 'first_ride', 'client', 'fixed_amount', 10000, 0, true, '{"system":true}'::jsonb
where not exists (
  select 1 from public.bonus_campaigns where campaign_type = 'first_ride' and name = 'Default First Ride Bonus'
);

insert into public.bonus_campaigns (
  name,
  campaign_type,
  audience_type,
  reward_type,
  reward_amount_uzs,
  min_order_amount_uzs,
  is_active,
  metadata
)
select 'Default Referral Bonus', 'referral', 'both', 'fixed_amount', 3000, 20000, true, '{"system":true}'::jsonb
where not exists (
  select 1 from public.bonus_campaigns where campaign_type = 'referral' and name = 'Default Referral Bonus'
);

-- =========================
-- LEGACY BONUS CLEANUP MARKERS
-- legacy bonus tables are retained only for historical compatibility.
-- canonical reward source of truth is:
--   wallets.bonus_balance_uzs
--   wallet_transactions
--   referral_codes / referrals / referral_rewards
--   promo_codes / promo_redemptions
-- =========================
-- SOURCE: sql/99_unigo_reward_engine_cutover.sql
-- UniGo Reward Engine hardening cutover
-- Canonical reward/referral/promo stack only.
-- This migration is intentionally additive + destructive for deprecated bonus tables.

begin;

set search_path = public;

-- 1) Remove deprecated bonus tables completely.
drop table if exists public.client_bonuses cascade;
drop table if exists public.bonus_transactions cascade;
drop table if exists public.driver_bonus cascade;
drop table if exists public.driver_bonus_ledger cascade;

-- 2) Canonical wallet tx kinds.
-- Backward-compatible drift guard: some environments have only `metadata`, some have both `metadata` + `meta`.
alter table if exists public.wallet_transactions
  add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table if exists public.wallet_transactions
  add column if not exists meta jsonb not null default '{}'::jsonb;

update public.wallet_transactions
set metadata = coalesce(metadata, '{}'::jsonb) || coalesce(meta, '{}'::jsonb)
where coalesce(metadata, '{}'::jsonb) = '{}'::jsonb
  and coalesce(meta, '{}'::jsonb) <> '{}'::jsonb;

update public.wallet_transactions
set meta = coalesce(meta, '{}'::jsonb) || coalesce(metadata, '{}'::jsonb)
where coalesce(meta, '{}'::jsonb) = '{}'::jsonb
  and coalesce(metadata, '{}'::jsonb) <> '{}'::jsonb;

alter table if exists public.wallet_transactions
  drop constraint if exists wallet_transactions_kind_check;
alter table if exists public.wallet_transactions
  add constraint wallet_transactions_kind_check
  check (
    kind in (
      'topup',
      'withdraw',
      'order_payment',
      'order_payout',
      'commission',
      'refund',
      'ad_fee',
      'manual_adjustment',
      'spend',
      'bonus',
      'referral_bonus',
      'promo_bonus',
      'mission_bonus',
      'loyalty_bonus'
    )
  );

create index if not exists idx_wallet_transactions_user_kind_created
  on public.wallet_transactions(user_id, kind, created_at desc);
create index if not exists idx_wallet_transactions_order_kind
  on public.wallet_transactions(order_id, kind)
  where order_id is not null;
create unique index if not exists uq_wallet_transactions_reward_key
  on public.wallet_transactions ((coalesce(metadata ->> 'reward_key', meta ->> 'reward_key')))
  where coalesce(metadata ->> 'reward_key', meta ->> 'reward_key') is not null;
create unique index if not exists uq_wallet_transactions_order_settlement
  on public.wallet_transactions(user_id, order_id, kind, direction)
  where order_id is not null and kind in ('order_payment', 'order_payout');
create index if not exists idx_reward_locks_reward_type_created
  on public.reward_locks(reward_type, created_at desc);
create index if not exists idx_bonus_campaigns_active_priority
  on public.bonus_campaigns(is_active, priority desc, starts_at, ends_at);
create index if not exists idx_bonus_rules_trigger_campaign
  on public.bonus_rules(trigger_event, campaign_id);
create index if not exists idx_device_fingerprints_fingerprint
  on public.device_fingerprints(fingerprint);
create index if not exists idx_fraud_flags_user_created
  on public.fraud_flags(user_id, created_at desc);

-- 3) Atomic reward lock acquisition.
create or replace function public.reward_lock_acquire(
  p_reward_key text,
  p_reward_type text,
  p_source_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.reward_locks%rowtype;
  v_inserted boolean := false;
begin
  insert into public.reward_locks (
    reward_key,
    reward_type,
    source_id,
    metadata
  )
  values (
    p_reward_key,
    p_reward_type,
    p_source_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (reward_key) do nothing
  returning * into v_row;

  v_inserted := found;

  if not v_inserted then
    select * into v_row
    from public.reward_locks
    where reward_key = p_reward_key;
  end if;

  return jsonb_build_object(
    'acquired', v_inserted,
    'lock', to_jsonb(v_row)
  );
end;
$$;

-- 4) Atomic wallet mutation with transaction creation in one db transaction.
create or replace function public.wallet_apply_atomic(
  p_user_id uuid,
  p_balance_field text,
  p_direction text,
  p_amount_uzs bigint,
  p_tx_kind text,
  p_service_type text default null,
  p_order_id uuid default null,
  p_description text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.wallets%rowtype;
  v_delta bigint;
  v_balance_before bigint;
  v_balance_after bigint;
  v_tx_id uuid;
  v_now timestamptz := now();
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if p_balance_field not in ('balance_uzs', 'bonus_balance_uzs') then
    raise exception 'Unsupported balance field: %', p_balance_field;
  end if;

  if p_direction not in ('credit', 'debit') then
    raise exception 'Unsupported direction: %', p_direction;
  end if;

  if coalesce(p_amount_uzs, 0) <= 0 then
    raise exception 'Amount must be > 0';
  end if;

  insert into public.wallets (
    user_id,
    balance_uzs,
    bonus_balance_uzs,
    reserved_uzs,
    total_topup_uzs,
    total_spent_uzs,
    total_earned_uzs,
    is_frozen
  )
  values (
    p_user_id,
    0,
    0,
    0,
    0,
    0,
    0,
    false
  )
  on conflict (user_id) do nothing;

  select * into v_wallet
  from public.wallets
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'Wallet not found for user %', p_user_id;
  end if;

  if coalesce(v_wallet.is_frozen, false) then
    raise exception 'Wallet is frozen';
  end if;

  v_delta := case when p_direction = 'credit' then p_amount_uzs else -p_amount_uzs end;
  v_balance_before := case when p_balance_field = 'bonus_balance_uzs' then coalesce(v_wallet.bonus_balance_uzs, 0) else coalesce(v_wallet.balance_uzs, 0) end;
  v_balance_after := v_balance_before + v_delta;

  if v_balance_after < 0 then
    raise exception 'Insufficient funds in %', p_balance_field;
  end if;

  if p_balance_field = 'bonus_balance_uzs' then
    update public.wallets
    set
      bonus_balance_uzs = v_balance_after,
      total_earned_uzs = case when p_direction = 'credit' then coalesce(total_earned_uzs, 0) + p_amount_uzs else coalesce(total_earned_uzs, 0) end,
      total_spent_uzs = case when p_direction = 'debit' then coalesce(total_spent_uzs, 0) + p_amount_uzs else coalesce(total_spent_uzs, 0) end,
      updated_at = v_now
    where user_id = p_user_id;
  else
    update public.wallets
    set
      balance_uzs = v_balance_after,
      total_earned_uzs = case when p_direction = 'credit' and p_tx_kind in ('topup','order_payout','refund','manual_adjustment') then coalesce(total_earned_uzs, 0) + p_amount_uzs else coalesce(total_earned_uzs, 0) end,
      total_spent_uzs = case when p_direction = 'debit' then coalesce(total_spent_uzs, 0) + p_amount_uzs else coalesce(total_spent_uzs, 0) end,
      total_topup_uzs = case when p_direction = 'credit' and p_tx_kind = 'topup' then coalesce(total_topup_uzs, 0) + p_amount_uzs else coalesce(total_topup_uzs, 0) end,
      updated_at = v_now
    where user_id = p_user_id;
  end if;

  insert into public.wallet_transactions (
    user_id,
    direction,
    kind,
    service_type,
    amount_uzs,
    order_id,
    description,
    metadata,
    meta,
    created_at
  )
  values (
    p_user_id,
    p_direction,
    p_tx_kind,
    p_service_type,
    p_amount_uzs,
    p_order_id,
    p_description,
    coalesce(p_metadata, '{}'::jsonb),
    coalesce(p_metadata, '{}'::jsonb),
    v_now
  )
  returning id into v_tx_id;

  select * into v_wallet
  from public.wallets
  where user_id = p_user_id;

  return jsonb_build_object(
    'wallet_transaction_id', v_tx_id,
    'wallet', to_jsonb(v_wallet),
    'metadata', coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

grant execute on function public.reward_lock_acquire(text, text, uuid, jsonb) to authenticated, service_role;
grant execute on function public.wallet_apply_atomic(uuid, text, text, bigint, text, text, uuid, text, jsonb) to authenticated, service_role;

comment on function public.reward_lock_acquire(text, text, uuid, jsonb) is 'Atomic reward idempotency lock acquisition';
comment on function public.wallet_apply_atomic(uuid, text, text, bigint, text, text, uuid, text, jsonb) is 'Atomic wallet update + wallet_transactions insert';

commit;
