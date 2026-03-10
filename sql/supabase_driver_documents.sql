-- Extensions
create extension if not exists pgcrypto;

-- Status enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'driver_application_status'
  ) THEN
    CREATE TYPE public.driver_application_status AS ENUM (
      'pending',
      'approved',
      'rejected'
    );
  END IF;
END $$;

-- updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- driver_applications
create table if not exists public.driver_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  last_name text,
  first_name text,
  middle_name text,
  phone text,
  passport_number text,

  vehicle_type text,
  brand text,
  model text,
  plate_number text,
  year text,
  color text,
  seats integer,
  cargo_kg numeric,
  cargo_m3 numeric,

  status public.driver_application_status not null default 'pending',
  rejection_reason text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'driver_applications_user_id_unique'
  ) THEN
    ALTER TABLE public.driver_applications
    ADD CONSTRAINT driver_applications_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_driver_applications_updated_at ON public.driver_applications;
CREATE TRIGGER trg_driver_applications_updated_at
BEFORE UPDATE ON public.driver_applications
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- driver_documents
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'driver_documents_application_doc_type_unique'
  ) THEN
    ALTER TABLE public.driver_documents
    ADD CONSTRAINT driver_documents_application_doc_type_unique UNIQUE (application_id, doc_type);
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_driver_documents_updated_at ON public.driver_documents;
CREATE TRIGGER trg_driver_documents_updated_at
BEFORE UPDATE ON public.driver_documents
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.driver_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "driver_applications_select_own" ON public.driver_applications;
DROP POLICY IF EXISTS "driver_applications_insert_own" ON public.driver_applications;
DROP POLICY IF EXISTS "driver_applications_update_own_pending" ON public.driver_applications;

CREATE POLICY "driver_applications_select_own"
ON public.driver_applications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "driver_applications_insert_own"
ON public.driver_applications
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "driver_applications_update_own_pending"
ON public.driver_applications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'pending')
WITH CHECK (user_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "driver_documents_select_own" ON public.driver_documents;
DROP POLICY IF EXISTS "driver_documents_insert_own" ON public.driver_documents;
DROP POLICY IF EXISTS "driver_documents_update_own" ON public.driver_documents;
DROP POLICY IF EXISTS "driver_documents_delete_own" ON public.driver_documents;

CREATE POLICY "driver_documents_select_own"
ON public.driver_documents
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "driver_documents_insert_own"
ON public.driver_documents
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "driver_documents_update_own"
ON public.driver_documents
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "driver_documents_delete_own"
ON public.driver_documents
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('driver-documents', 'driver-documents', true)
on conflict (id) do nothing;

DROP POLICY IF EXISTS "driver_docs_read_own" ON storage.objects;
DROP POLICY IF EXISTS "driver_docs_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "driver_docs_update_own" ON storage.objects;
DROP POLICY IF EXISTS "driver_docs_delete_own" ON storage.objects;

CREATE POLICY "driver_docs_read_own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "driver_docs_insert_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'driver-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "driver_docs_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'driver-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'driver-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "driver_docs_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'driver-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
