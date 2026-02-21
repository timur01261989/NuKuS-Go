-- Nukus Go: Schema + TEMP testing policies
-- 1) Run schema
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
  driver_user_id uuid references users(id),
  pickup jsonb not null,
  dropoff jsonb not null,
  status text not null default 'created',
  created_at timestamptz not null default now()
);

create table if not exists driver_locations (
  order_id uuid not null references orders(id) on delete cascade,
  driver_user_id uuid not null references users(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  bearing double precision,
  speed double precision,
  updated_at timestamptz not null default now(),
  primary key (order_id, driver_user_id)
);

create index if not exists idx_listings_created_at on market_listings(created_at desc);
create index if not exists idx_orders_created_at on orders(created_at desc);

-- 2) Enable realtime in Supabase dashboard for: orders, driver_locations, market_listings (optional)

-- 3) TEMP RLS (ONLY TEST). Replace with strict policies after Supabase Auth is enabled.
alter table orders enable row level security;
alter table driver_locations enable row level security;
alter table market_listings enable row level security;
alter table market_listing_images enable row level security;

drop policy if exists orders_open_select on orders;
create policy orders_open_select on orders for select using (true);
drop policy if exists orders_open_insert on orders;
create policy orders_open_insert on orders for insert with check (true);
drop policy if exists orders_open_update on orders;
create policy orders_open_update on orders for update using (true);

drop policy if exists driver_locations_open_select on driver_locations;
create policy driver_locations_open_select on driver_locations for select using (true);
drop policy if exists driver_locations_open_insert on driver_locations;
create policy driver_locations_open_insert on driver_locations for insert with check (true);
drop policy if exists driver_locations_open_update on driver_locations;
create policy driver_locations_open_update on driver_locations for update using (true);

drop policy if exists market_listings_open_select on market_listings;
create policy market_listings_open_select on market_listings for select using (true);
drop policy if exists market_listings_open_insert on market_listings;
create policy market_listings_open_insert on market_listings for insert with check (true);

drop policy if exists market_images_open_select on market_listing_images;
create policy market_images_open_select on market_listing_images for select using (true);
drop policy if exists market_images_open_insert on market_listing_images;
create policy market_images_open_insert on market_listing_images for insert with check (true);
