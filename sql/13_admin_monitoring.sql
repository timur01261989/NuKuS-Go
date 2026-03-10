
create table if not exists platform_monitoring(
 id uuid primary key default gen_random_uuid(),
 metric text,
 value numeric,
 created_at timestamptz default now()
);
