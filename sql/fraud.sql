-- UniGo Stage-6: Anti-fraud minimal schema (SAFE ADDITIVE)

create table if not exists public.device_fingerprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  device_hash text not null,
  platform text,
  first_seen timestamptz default now(),
  last_seen timestamptz default now(),
  meta jsonb
);

create unique index if not exists uq_device_fingerprints_user_device on public.device_fingerprints(user_id, device_hash);

create table if not exists public.fraud_flags (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null, -- 'order' | 'user' | 'driver'
  entity_id uuid not null,
  score numeric not null default 0,
  reason text,
  meta jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_fraud_flags_entity on public.fraud_flags(entity_type, entity_id);
create index if not exists idx_fraud_flags_created on public.fraud_flags(created_at desc);

alter table public.device_fingerprints enable row level security;
alter table public.fraud_flags enable row level security;

-- Conservative policies: only service role writes; authenticated can read own flags (optional)
drop policy if exists "device_fingerprints_select_own" on public.device_fingerprints;
create policy "device_fingerprints_select_own" on public.device_fingerprints
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "fraud_flags_select_authenticated" on public.fraud_flags;
create policy "fraud_flags_select_authenticated" on public.fraud_flags
for select to authenticated
using (true);
