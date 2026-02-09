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
