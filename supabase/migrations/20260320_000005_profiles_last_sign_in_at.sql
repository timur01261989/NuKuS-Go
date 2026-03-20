-- Compatibility: client expects profiles.last_sign_in_at (login upsert + selects).
-- If this column is missing in current DB, Supabase REST returns 400.

alter table public.profiles
add column if not exists last_sign_in_at timestamptz;

