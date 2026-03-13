
create table if not exists dispatch_clusters (
 id uuid primary key default gen_random_uuid(),
 region_key text,
 worker_group text,
 created_at timestamptz default now()
);

create table if not exists dispatch_job_queue (
 id uuid primary key default gen_random_uuid(),
 order_id uuid,
 payload jsonb,
 status text default 'pending',
 created_at timestamptz default now()
);

create index if not exists idx_dispatch_job_queue_status
on dispatch_job_queue(status);
