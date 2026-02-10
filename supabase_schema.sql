create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists market_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  title text not null,
  price_uzs bigint not null,
  year int,
  mileage_km int,
  fuel text,
  gearbox text,
  city text,
  phone text,
  description text,
  state text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists market_listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references market_listings(id) on delete cascade,
  url text not null,
  sort int not null default 0
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  client_user_id uuid references users(id),
  pickup jsonb not null,
  dropoff jsonb not null,
  status text not null default 'created',
  created_at timestamptz not null default now()
);

create index if not exists idx_listings_created_at on market_listings(created_at desc);
create index if not exists idx_orders_created_at on orders(created_at desc);

-- DRIVERS (driver akkaunt)
create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references users(id) on delete cascade,
  full_name text,
  car_model text,
  car_number text,
  is_online boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_drivers_is_online on drivers(is_online);

-- DRIVER LOCATIONS (realtime joylashuv)
create table if not exists driver_locations (
  driver_id uuid primary key references drivers(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_driver_locations_updated_at on driver_locations(updated_at desc);
create index if not exists idx_driver_locations_lat_lng on driver_locations(lat, lng);

