
create table if not exists driver_distribution_predictions (
 id uuid primary key default gen_random_uuid(),
 region_key text,
 drivers_needed int,
 created_at timestamptz default now()
);
