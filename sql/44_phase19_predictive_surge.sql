
create table if not exists predictive_surge_zones (
 id uuid primary key default gen_random_uuid(),
 region_key text,
 predicted_multiplier numeric default 1,
 created_at timestamptz default now()
);
