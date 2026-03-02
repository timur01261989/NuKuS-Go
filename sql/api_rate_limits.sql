-- api_rate_limits: lightweight per-key throttling (optional; can also do in-memory at edge)
create table if not exists api_rate_limits (
  key text primary key, -- e.g. ip:1.2.3.4 or user:uuid
  window_start timestamptz not null,
  count int not null default 0,
  updated_at timestamptz not null default now()
);