
create table if not exists fraud_flags (
 id uuid primary key default gen_random_uuid(),
 user_id uuid,
 reason text,
 score numeric,
 created_at timestamptz default now()
);
