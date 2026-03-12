create table if not exists public.trip_waitlists (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  user_id uuid null,
  seats integer not null default 1,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.trip_ranking_signals (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  user_id uuid null,
  corridor_score numeric(8,2) not null default 0,
  reliability_score numeric(8,2) not null default 0,
  price_score numeric(8,2) not null default 0,
  amenity_score numeric(8,2) not null default 0,
  final_score numeric(8,2) not null default 0,
  created_at timestamptz not null default now()
);
