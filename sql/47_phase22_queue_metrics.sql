
create table if not exists queue_metrics (
 id uuid primary key default gen_random_uuid(),
 queue_name text,
 jobs_pending int,
 jobs_processing int,
 created_at timestamptz default now()
);
