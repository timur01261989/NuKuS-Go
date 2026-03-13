
create table if not exists dispatch_events (
 id uuid primary key default gen_random_uuid(),
 order_id uuid,
 driver_id uuid,
 event_type text,
 created_at timestamptz default now()
);
