create extension if not exists pgcrypto;

alter table if exists public.profiles
add column if not exists phone_verified boolean not null default false;

alter table if exists public.profiles
add column if not exists phone_verified_at timestamptz null;

create table if not exists public.phone_otp_verifications (
  id uuid primary key default gen_random_uuid(),
  phone_e164 text not null,
  purpose text not null check (purpose in ('signup', 'phone_change', 'reset_password')),
  otp_hash text not null,
  expires_at timestamptz not null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 5 check (max_attempts > 0),
  resend_count integer not null default 1 check (resend_count >= 0),
  last_sent_at timestamptz not null default now(),
  verified_at timestamptz null,
  status text not null default 'pending' check (status in ('pending', 'verified', 'expired', 'blocked', 'cancelled', 'failed')),
  provider text not null default 'telerivet',
  provider_message_id text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_phone_otp_verifications_phone_purpose_status
on public.phone_otp_verifications (phone_e164, purpose, status);

create index if not exists idx_phone_otp_verifications_expires_at
on public.phone_otp_verifications (expires_at);

create index if not exists idx_phone_otp_verifications_created_at
on public.phone_otp_verifications (created_at desc);

create or replace function public.set_phone_otp_verifications_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_phone_otp_verifications_updated_at on public.phone_otp_verifications;

create trigger trg_set_phone_otp_verifications_updated_at
before update on public.phone_otp_verifications
for each row
execute function public.set_phone_otp_verifications_updated_at();

alter table public.phone_otp_verifications enable row level security;

drop policy if exists "service_role_full_access_phone_otp_verifications" on public.phone_otp_verifications;
create policy "service_role_full_access_phone_otp_verifications"
on public.phone_otp_verifications
for all
to service_role
using (true)
with check (true);
