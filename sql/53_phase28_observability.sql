create table if not exists observability_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_name text not null,
  metric_value numeric not null default 0,
  labels jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_observability_metrics_name_created
on observability_metrics(metric_name, created_at desc);
