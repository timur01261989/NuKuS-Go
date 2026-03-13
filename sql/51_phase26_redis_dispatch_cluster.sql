create table if not exists redis_dispatch_cluster_nodes (
  id uuid primary key default gen_random_uuid(),
  node_key text not null,
  host text,
  port integer,
  role text default 'worker',
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists redis_dispatch_queue_state (
  id uuid primary key default gen_random_uuid(),
  queue_name text not null,
  pending_count integer default 0,
  processing_count integer default 0,
  failed_count integer default 0,
  updated_at timestamptz default now()
);

create index if not exists idx_redis_dispatch_queue_state_name
on redis_dispatch_queue_state(queue_name, updated_at desc);
