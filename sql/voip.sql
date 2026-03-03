-- sql/voip.sql
-- VOIP call logs only (no VOIP implementation). SAFE additive.

begin;

create table if not exists public.voip_call_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid null,
  caller_role text null,
  caller_id uuid null,
  callee_role text null,
  callee_id uuid null,
  provider text null,
  room_id text null,
  started_at timestamptz not null default now(),
  ended_at timestamptz null,
  duration_sec int null,
  meta jsonb null
);

create index if not exists voip_call_logs_order_idx on public.voip_call_logs(order_id);
create index if not exists voip_call_logs_started_idx on public.voip_call_logs(started_at);

commit;
