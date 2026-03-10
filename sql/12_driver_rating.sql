
create table if not exists driver_ratings(
 id uuid primary key default gen_random_uuid(),
 driver_id uuid,
 order_id uuid,
 rating int,
 created_at timestamptz default now()
);
