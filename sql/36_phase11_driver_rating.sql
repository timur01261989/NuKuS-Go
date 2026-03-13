
create table if not exists driver_rating (
 id uuid primary key default gen_random_uuid(),
 driver_id uuid,
 rating numeric,
 created_at timestamptz default now()
);
