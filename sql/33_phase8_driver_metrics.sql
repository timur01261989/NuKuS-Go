
create table if not exists driver_metrics (
  driver_id uuid primary key,
  rating numeric default 5,
  acceptance_rate numeric default 0.8,
  priority numeric default 0.5,
  updated_at timestamptz default now()
);
