-- NuKuS-Go (FIXED minimal auth schema for this repo)
-- Purpose:
--   - Ensure `profiles` and `drivers` tables exist with columns that the frontend uses.
--   - Provide safe RLS so:
--       * a logged-in user can read/update their own profile
--       * public (anon) cannot read/write profiles
--
-- Run in Supabase SQL Editor as postgres role.

begin;

-- Extensions
create extension if not exists "pgcrypto";

-- =========
-- PROFILES
-- =========
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text unique,
  avatar_url text,
  role text not null default 'client' check (role in ('client','driver','admin','dispatch')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login timestamptz
);

create index if not exists idx_profiles_role on public.profiles(role);

-- updated_at auto
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto-create profile on signup (safe default role client)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, phone, role, created_at, updated_at, last_login)
  values (new.id, new.phone, 'client', now(), now(), now())
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =========
-- DRIVERS
-- =========
create table if not exists public.drivers (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- =========
-- RLS
-- =========
alter table public.profiles enable row level security;
alter table public.drivers enable row level security;

-- PROFILES policies
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

-- DRIVERS policies (driver can read own driver row; admin can manage via service role)
drop policy if exists "drivers_select_own" on public.drivers;
create policy "drivers_select_own"
on public.drivers
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "drivers_insert_own" on public.drivers;
create policy "drivers_insert_own"
on public.drivers
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "drivers_update_own" on public.drivers;
create policy "drivers_update_own"
on public.drivers
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

commit;
