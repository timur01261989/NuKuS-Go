create table if not exists api_rate_limits (
  id uuid primary key default gen_random_uuid(),
  actor_key text not null,
  route_key text not null,
  request_count integer default 0,
  window_started_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(actor_key, route_key)
);

create index if not exists idx_api_rate_limits_route
on api_rate_limits(route_key, updated_at desc);
