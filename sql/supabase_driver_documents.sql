create extension if not exists pgcrypto;

create table if not exists public.driver_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  vehicle_type text,
  brand text,
  model text,
  plate_number text,
  status text default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.driver_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.driver_applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  doc_type text not null,
  file_path text not null,
  file_url text,
  file_size bigint,
  mime_type text,
  created_at timestamptz not null default now()
);

create unique index if not exists driver_documents_application_doc_type_uidx
on public.driver_documents(application_id, doc_type);

alter table public.driver_applications enable row level security;
alter table public.driver_documents enable row level security;

drop policy if exists "driver_applications_select_own" on public.driver_applications;
create policy "driver_applications_select_own"
on public.driver_applications
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "driver_applications_insert_own" on public.driver_applications;
create policy "driver_applications_insert_own"
on public.driver_applications
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "driver_applications_update_own" on public.driver_applications;
create policy "driver_applications_update_own"
on public.driver_applications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "driver_documents_select_own" on public.driver_documents;
create policy "driver_documents_select_own"
on public.driver_documents
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "driver_documents_insert_own" on public.driver_documents;
create policy "driver_documents_insert_own"
on public.driver_documents
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "driver_documents_update_own" on public.driver_documents;
create policy "driver_documents_update_own"
on public.driver_documents
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
