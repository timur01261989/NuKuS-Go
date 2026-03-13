
create table if not exists demand_heatmap (
  id uuid primary key default gen_random_uuid(),
  lat numeric,
  lng numeric,
  demand_score numeric default 0,
  updated_at timestamptz default now()
);
