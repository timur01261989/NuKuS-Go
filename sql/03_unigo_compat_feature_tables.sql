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
  matched_trip_id uuid references public.inter_prov_trips(id) on delete set null,
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

create table if not exists public.inter_prov_trips (
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
create table if not exists public.interprov_trips ( like public.inter_prov_trips including all );
create table if not exists public.inter_prov_seat_requests (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.inter_prov_trips(id) on delete cascade,
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
create table if not exists public.client_bonuses ( id uuid primary key default gen_random_uuid(), user_id uuid, balance_points int not null default 0, updated_at timestamptz not null default now() );
create table if not exists public.bonus_transactions ( id uuid primary key default gen_random_uuid(), user_id uuid, points int not null, reason text, created_at timestamptz not null default now() );
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
