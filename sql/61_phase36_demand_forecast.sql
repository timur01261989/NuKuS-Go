
create table if not exists demand_forecasts (
 id uuid primary key default gen_random_uuid(),
 region_key text,
 predicted_orders int,
 prediction_window_minutes int default 30,
 created_at timestamptz default now()
);
