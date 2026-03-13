
create table if not exists dispatch_waves (
 id uuid primary key default gen_random_uuid(),
 order_id uuid,
 wave_index int,
 created_at timestamptz default now()
);
