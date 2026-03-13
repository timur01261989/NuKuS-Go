
create table if not exists driver_supply_predictions (
 id uuid primary key default gen_random_uuid(),
 region_key text,
 drivers_required int,
 created_at timestamptz default now()
);
