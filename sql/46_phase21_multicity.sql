
create table if not exists cities (
 id uuid primary key default gen_random_uuid(),
 name text,
 region_code text,
 created_at timestamptz default now()
);

alter table orders add column if not exists city_id uuid;
alter table driver_presence add column if not exists city_id uuid;
