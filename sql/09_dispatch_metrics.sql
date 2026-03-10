create table if not exists public.dispatch_metrics (
 id uuid primary key default gen_random_uuid(),
 order_id uuid,
 drivers_sent int default 0,
 accepted boolean default false,
 created_at timestamptz default now()
);

create index if not exists idx_dispatch_metrics_order
on public.dispatch_metrics(order_id);
