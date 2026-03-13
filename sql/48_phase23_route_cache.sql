
create table if not exists route_cache (
 id uuid primary key default gen_random_uuid(),
 origin text,
 destination text,
 distance_km numeric,
 eta_min int,
 created_at timestamptz default now()
);
