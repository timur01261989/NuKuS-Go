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
  client_id uuid not null references public.profiles(id) on delete cascade,
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

create index if not exists idx_orders_client on public.orders(client_id, created_at desc);
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
    where user_id = v_order.client_id
    for update;

    if coalesce(v_wallet_balance, 0) < v_order.price_uzs then
      raise exception 'Client wallet balance is insufficient';
    end if;

    update public.wallets
       set balance_uzs = balance_uzs - v_order.price_uzs,
           total_spent_uzs = total_spent_uzs + v_order.price_uzs,
           updated_at = now()
     where user_id = v_order.client_id;

    update public.wallets
       set balance_uzs = balance_uzs + coalesce(v_order.driver_payout_uzs, 0),
           total_earned_uzs = total_earned_uzs + coalesce(v_order.driver_payout_uzs, 0),
           updated_at = now()
     where user_id = v_order.driver_id;

    insert into public.wallet_transactions(user_id, direction, kind, service_type, amount_uzs, order_id, description)
    values
      (v_order.client_id, 'debit', 'order_payment', v_order.service_type, v_order.price_uzs, p_order_id, 'Order payment'),
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