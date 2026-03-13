
create table if not exists service_registry (
 id uuid primary key default gen_random_uuid(),
 service_key text,
 dispatch_pipeline text,
 created_at timestamptz default now()
);
