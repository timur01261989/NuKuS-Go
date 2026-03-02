-- job_queue: simple DB-backed queue for async work (push, dispatch retries, billing, etc.)
create table if not exists job_queue (
  id bigserial primary key,
  type text not null, -- 'send_push' | 'dispatch_tick' | 'billing_finalize' etc.
  payload jsonb not null,
  status text not null default 'queued', -- queued|processing|done|failed
  run_at timestamptz not null default now(),
  attempts int not null default 0,
  last_error text,
  locked_by text,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_queue_status_run_at_idx on job_queue(status, run_at);