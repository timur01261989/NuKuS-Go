
create table if not exists global_regions (
 id uuid primary key default gen_random_uuid(),
 region_code text,
 region_name text,
 created_at timestamptz default now()
);

create table if not exists region_routing (
 id uuid primary key default gen_random_uuid(),
 region_code text,
 dispatch_cluster text,
 created_at timestamptz default now()
);
