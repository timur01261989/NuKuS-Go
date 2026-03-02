-- idempotency_keys: ensures repeated requests don't duplicate effects
create table if not exists idempotency_keys (
  key text primary key,
  scope text not null, -- e.g. 'order_create', 'payment_charge'
  request_hash text,
  response jsonb,
  status text not null default 'completed', -- completed|in_progress|failed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idempotency_scope_created_idx on idempotency_keys(scope, created_at desc);