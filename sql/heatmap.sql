-- UniGo Stage-6: Heatmap / Demand hotspots (SAFE ADDITIVE)
-- Run in Supabase SQL Editor. Uses IF NOT EXISTS.

create table if not exists public.demand_hotspots (
  id uuid primary key default gen_random_uuid(),
  geokey text not null,
  service_type text not null default 'taxi',
  center_lat numeric,
  center_lng numeric,
  window_start timestamptz not null default now(),
  window_minutes integer not null default 30,
  demand_count integer not null default 0,
  demand_score numeric not null default 0,
  updated_at timestamptz default now()
);

create unique index if not exists uq_demand_hotspots_key on public.demand_hotspots(geokey, service_type);

-- Optional: allow read for authenticated
alter table public.demand_hotspots enable row level security;

drop policy if exists "demand_hotspots_read" on public.demand_hotspots;
create policy "demand_hotspots_read" on public.demand_hotspots
for select to authenticated
using (true);
