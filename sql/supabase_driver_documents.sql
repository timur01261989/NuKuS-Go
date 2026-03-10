create extension if not exists pgcrypto;

alter table public.driver_applications
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists last_name text,
  add column if not exists first_name text,
  add column if not exists middle_name text,
  add column if not exists phone text,
  add column if not exists passport_number text,
  add column if not exists vehicle_type text,
  add column if not exists brand text,
  add column if not exists model text,
  add column if not exists plate_number text,
  add column if not exists year integer,
  add column if not exists color text,
  add column if not exists seats integer,
  add column if not exists cargo_kg numeric,
  add column if not exists cargo_m3 numeric,
  add column if not exists status text default 'pending',
  add column if not exists submitted_at timestamptz,
  add column if not exists updated_at timestamptz default now();

create table if not exists public.driver_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.driver_applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  doc_type text not null,
  file_path text not null,
  file_url text,
  file_name text,
  file_size bigint,
  mime_type text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists driver_documents_application_doc_type_idx on public.driver_documents(application_id, doc_type);

alter table public.driver_applications enable row level security;
alter table public.driver_documents enable row level security;

drop policy if exists driver_applications_select_own on public.driver_applications;
create policy driver_applications_select_own on public.driver_applications for select to authenticated using (user_id = auth.uid());
drop policy if exists driver_applications_insert_own on public.driver_applications;
create policy driver_applications_insert_own on public.driver_applications for insert to authenticated with check (user_id = auth.uid());
drop policy if exists driver_applications_update_own on public.driver_applications;
create policy driver_applications_update_own on public.driver_applications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists driver_documents_select_own on public.driver_documents;
create policy driver_documents_select_own on public.driver_documents for select to authenticated using (user_id = auth.uid());
drop policy if exists driver_documents_insert_own on public.driver_documents;
create policy driver_documents_insert_own on public.driver_documents for insert to authenticated with check (user_id = auth.uid());
drop policy if exists driver_documents_update_own on public.driver_documents;
create policy driver_documents_update_own on public.driver_documents for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into storage.buckets (id, name, public) values ('driver-documents', 'driver-documents', true) on conflict (id) do nothing;

drop policy if exists driver_docs_read_own on storage.objects;
create policy driver_docs_read_own on storage.objects for select to authenticated using (bucket_id = 'driver-documents' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists driver_docs_insert_own on storage.objects;
create policy driver_docs_insert_own on storage.objects for insert to authenticated with check (bucket_id = 'driver-documents' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists driver_docs_update_own on storage.objects;
create policy driver_docs_update_own on storage.objects for update to authenticated using (bucket_id = 'driver-documents' and auth.uid()::text = (storage.foldername(name))[1]) with check (bucket_id = 'driver-documents' and auth.uid()::text = (storage.foldername(name))[1]);
