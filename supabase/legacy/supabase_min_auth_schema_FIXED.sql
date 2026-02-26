-- NUKUS GO: Minimal Auth Schema (profiles, roles, auth trigger)
-- Bu fayl birinchi bajarilishi kerak
-- Run in Supabase SQL Editor

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES TABLE (barcha foydalanuvchilar)
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('client','driver','admin')) default 'client',
  full_name text,
  phone text,
  avatar_url text,
  is_verified boolean default false,
  language text default 'uz',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_phone on public.profiles(phone);

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS Policies
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_select_drivers_public" on public.profiles;
create policy "profiles_select_drivers_public"
on public.profiles for select
to authenticated
using (role = 'driver');

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

-- ============================================================
-- AUTH TRIGGER: Yangi user create qilganda profile yaratish
-- ============================================================

create or replace function public.create_profile_on_signup()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_on_signup();

-- ============================================================
-- GRANTS
-- ============================================================

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.profiles to anon;
grant usage, select on all sequences in schema public to authenticated;
