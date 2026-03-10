create table if not exists demand_heatmap (
  id uuid primary key default gen_random_uuid(),
  area text,
  orders int default 0,
  drivers int default 0,
  surge_multiplier numeric default 1,
  created_at timestamptz default now()
);

create index if not exists idx_demand_heatmap_area_created_at
on demand_heatmap(area, created_at desc);
