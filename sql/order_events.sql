-- order_events: analytics/audit trail
create table if not exists order_events (
  id bigserial primary key,
  order_id uuid not null references orders(id) on delete cascade,
  event text not null,
  from_status text,
  to_status text,
  actor_role text,
  actor_id uuid,
  reason text,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_idx on order_events(order_id, created_at desc);