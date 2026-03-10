create table if not exists public.driver_rating_votes (
 id uuid primary key default gen_random_uuid(),
 order_id uuid,
 driver_id uuid,
 client_id uuid,
 rating int check (rating >= 1 and rating <= 5),
 comment text,
 created_at timestamptz default now()
);

create table if not exists public.driver_bonus_ledger (
 id uuid primary key default gen_random_uuid(),
 driver_id uuid,
 amount_uzs bigint not null,
 reason text,
 meta jsonb default '{}'::jsonb,
 created_at timestamptz default now()
);

create table if not exists public.cancel_penalties (
 id uuid primary key default gen_random_uuid(),
 order_id uuid,
 actor_user_id uuid,
 actor_role text,
 penalty_uzs bigint not null default 0,
 reason text,
 created_at timestamptz default now()
);

create table if not exists public.fraud_flags (
 id uuid primary key default gen_random_uuid(),
 order_id uuid,
 user_id uuid,
 flags jsonb default '[]'::jsonb,
 created_at timestamptz default now()
);
