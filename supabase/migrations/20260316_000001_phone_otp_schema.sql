create extension if not exists pgcrypto;

create table if not exists public.phone_otp_verifications (
  id uuid primary key default gen_random_uuid(),
  phone text,
  phone_e164 text,
  purpose text not null default 'signup',
  otp_hash text,
  otp_code text,
  status text not null default 'pending',
  resend_count integer not null default 0,
  attempt_count integer not null default 0,
  last_sent_at timestamptz,
  expires_at timestamptz,
  verified_at timestamptz,
  provider_message_id text,
  provider_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.phone_otp_verifications
  add column if not exists phone text;

alter table public.phone_otp_verifications
  add column if not exists phone_e164 text;

alter table public.phone_otp_verifications
  add column if not exists purpose text not null default 'signup';

alter table public.phone_otp_verifications
  add column if not exists otp_hash text;

alter table public.phone_otp_verifications
  add column if not exists otp_code text;

alter table public.phone_otp_verifications
  add column if not exists status text not null default 'pending';

alter table public.phone_otp_verifications
  add column if not exists resend_count integer not null default 0;

alter table public.phone_otp_verifications
  add column if not exists attempt_count integer not null default 0;

alter table public.phone_otp_verifications
  add column if not exists last_sent_at timestamptz;

alter table public.phone_otp_verifications
  add column if not exists expires_at timestamptz;

alter table public.phone_otp_verifications
  add column if not exists verified_at timestamptz;

alter table public.phone_otp_verifications
  add column if not exists provider_message_id text;

alter table public.phone_otp_verifications
  add column if not exists provider_status text;

alter table public.phone_otp_verifications
  add column if not exists created_at timestamptz not null default now();

alter table public.phone_otp_verifications
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_phone_otp_verifications_phone_e164
  on public.phone_otp_verifications(phone_e164);

create index if not exists idx_phone_otp_verifications_status
  on public.phone_otp_verifications(status);

create index if not exists idx_phone_otp_verifications_purpose
  on public.phone_otp_verifications(purpose);

create index if not exists idx_phone_otp_verifications_created_at
  on public.phone_otp_verifications(created_at desc);

alter table public.phone_otp_verifications enable row level security;

drop policy if exists "service_role_full_access_phone_otp_verifications" on public.phone_otp_verifications;
create policy "service_role_full_access_phone_otp_verifications"
on public.phone_otp_verifications
for all
to service_role
using (true)
with check (true);
