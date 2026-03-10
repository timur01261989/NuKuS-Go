
create table if not exists driver_earnings(
 id uuid primary key default gen_random_uuid(),
 driver_id uuid,
 order_id uuid,
 amount numeric,
 created_at timestamptz default now()
);
