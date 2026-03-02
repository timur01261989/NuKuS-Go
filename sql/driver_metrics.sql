-- driver_metrics: used for scoring/penalties
create table if not exists driver_metrics (
  driver_id uuid primary key references drivers(id) on delete cascade,
  acceptance_rate double precision not null default 1,
  cancel_rate double precision not null default 0,
  completed_count int not null default 0,
  last_trip_at timestamptz,
  updated_at timestamptz not null default now()
);