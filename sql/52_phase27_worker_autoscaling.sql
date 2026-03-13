create table if not exists worker_autoscaling_state (
  id uuid primary key default gen_random_uuid(),
  worker_group text not null,
  min_workers integer default 1,
  max_workers integer default 10,
  current_workers integer default 1,
  queue_depth integer default 0,
  cpu_load numeric default 0,
  updated_at timestamptz default now()
);

create index if not exists idx_worker_autoscaling_state_group
on worker_autoscaling_state(worker_group, updated_at desc);
