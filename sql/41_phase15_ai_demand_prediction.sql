begin;

create table if not exists public.dispatch_demand_predictions (
  id uuid primary key default gen_random_uuid(),
  service_type text not null default 'taxi',
  region_key text not null,
  predicted_orders integer not null default 0,
  predicted_drivers_needed integer not null default 0,
  confidence numeric(5,4) not null default 0.5000,
  prediction_window_minutes integer not null default 30,
  source text not null default 'heuristic_ai_v1',
  created_at timestamptz not null default now(),
  unique(service_type, region_key, prediction_window_minutes, created_at)
);

create index if not exists idx_dispatch_demand_predictions_lookup
on public.dispatch_demand_predictions(service_type, region_key, created_at desc);

create table if not exists public.driver_reposition_tasks (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null,
  service_type text not null default 'taxi',
  target_region_key text not null,
  reason text not null default 'predicted_demand',
  priority numeric(10,4) not null default 0,
  status text not null default 'pending',
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_driver_reposition_tasks_driver_status
on public.driver_reposition_tasks(driver_id, status, created_at desc);

commit;
