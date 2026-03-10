create table if not exists driver_location_stream (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid,
  lat double precision,
  lng double precision,
  ts timestamptz default now()
);

create index if not exists idx_driver_location_stream_driver_ts
on driver_location_stream(driver_id, ts desc);

create table if not exists sos_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  order_id uuid,
  lat double precision,
  lng double precision,
  message text,
  created_at timestamptz default now()
);

create index if not exists idx_sos_alerts_order_created
on sos_alerts(order_id, created_at desc);

create table if not exists platform_metrics (
  id uuid primary key default gen_random_uuid(),
  metric text not null,
  value numeric,
  meta jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_platform_metrics_metric_created
on platform_metrics(metric, created_at desc);
