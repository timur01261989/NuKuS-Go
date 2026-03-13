create table if not exists pricing_snapshots (
  id uuid primary key default gen_random_uuid(),
  service_type text not null,
  base_price numeric default 0,
  demand_multiplier numeric default 1,
  traffic_multiplier numeric default 1,
  final_multiplier numeric default 1,
  created_at timestamptz default now()
);
