
create table if not exists surge_zones (
 id uuid primary key default gen_random_uuid(),
 lat numeric,
 lng numeric,
 multiplier numeric default 1.0,
 updated_at timestamptz default now()
);
