
create table if not exists fraud_events (
 id uuid primary key default gen_random_uuid(),
 actor_id uuid,
 event_type text,
 risk_score numeric default 0,
 created_at timestamptz default now()
);
