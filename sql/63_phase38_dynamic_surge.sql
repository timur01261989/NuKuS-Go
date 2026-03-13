
create table if not exists surge_predictions (
 id uuid primary key default gen_random_uuid(),
 region_key text,
 surge_multiplier numeric default 1,
 created_at timestamptz default now()
);
