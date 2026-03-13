
create table if not exists driver_bonus (
 id uuid primary key default gen_random_uuid(),
 driver_id uuid,
 bonus_amount numeric,
 reason text,
 created_at timestamptz default now()
);
