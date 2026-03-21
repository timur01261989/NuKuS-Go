alter table if exists public.phone_otp_verifications
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create or replace function public.lookup_account_by_phone(input_phone text)
returns table (
  exists_account boolean,
  profile_id uuid,
  auth_user_id uuid,
  matched_phone text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_phone text;
  v_profile_id uuid;
  v_auth_user_id uuid;
  v_matched_phone text;
begin
  v_phone := public.normalize_phone_e164(input_phone);

  select p.id, p.id, coalesce(p.phone_normalized, p.phone)
  into v_profile_id, v_auth_user_id, v_matched_phone
  from public.profiles p
  where coalesce(p.phone_normalized, p.phone) = v_phone
     or p.phone = replace(v_phone, '+', '')
  order by p.created_at desc nulls last, p.id desc
  limit 1;

  if v_auth_user_id is null then
    select u.id, u.id, u.phone
    into v_profile_id, v_auth_user_id, v_matched_phone
    from auth.users u
    where u.phone = v_phone
    order by u.created_at desc
    limit 1;
  end if;

  return query
  select (v_auth_user_id is not null), v_profile_id, v_auth_user_id, v_matched_phone;
end;
$$;
revoke all on function public.lookup_account_by_phone(text) from public;
grant execute on function public.lookup_account_by_phone(text) to anon, authenticated, service_role;

create or replace function public.otp_get_pending(p_phone_e164 text, p_purpose text)
returns table (
  id uuid,
  resend_count integer,
  last_sent_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select v.id, v.resend_count, v.last_sent_at
  from public.phone_otp_verifications v
  where v.phone_e164 = p_phone_e164
    and v.purpose = p_purpose
    and v.status = 'pending'
    and v.verified_at is null
  order by v.created_at desc
  limit 1;
$$;
revoke all on function public.otp_get_pending(text, text) from public;
grant execute on function public.otp_get_pending(text, text) to anon, authenticated, service_role;

create or replace function public.otp_get_pending_full(p_phone_e164 text, p_purpose text)
returns table (
  id uuid,
  otp_hash text,
  otp_code text,
  expires_at timestamptz,
  attempt_count integer,
  metadata jsonb
)
language sql
security definer
set search_path = public
as $$
  select v.id, v.otp_hash, v.otp_code, v.expires_at, v.attempt_count, coalesce(v.metadata, '{}'::jsonb)
  from public.phone_otp_verifications v
  where v.phone_e164 = p_phone_e164
    and v.purpose = p_purpose
    and v.status = 'pending'
    and v.verified_at is null
  order by v.created_at desc
  limit 1;
$$;
revoke all on function public.otp_get_pending_full(text, text) from public;
grant execute on function public.otp_get_pending_full(text, text) to anon, authenticated, service_role;

create or replace function public.otp_create_pending(
  p_phone text,
  p_phone_e164 text,
  p_purpose text,
  p_otp_hash text,
  p_otp_code text,
  p_expires_at timestamptz,
  p_last_sent_at timestamptz,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.phone_otp_verifications (
    phone, phone_e164, purpose, otp_hash, otp_code, status,
    resend_count, attempt_count, last_sent_at, expires_at, metadata, created_at, updated_at
  ) values (
    p_phone, p_phone_e164, p_purpose, p_otp_hash, p_otp_code, 'pending',
    0, 0, p_last_sent_at, p_expires_at, coalesce(p_metadata, '{}'::jsonb), now(), now()
  ) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.otp_create_pending(text, text, text, text, text, timestamptz, timestamptz, jsonb) from public;
grant execute on function public.otp_create_pending(text, text, text, text, text, timestamptz, timestamptz, jsonb) to anon, authenticated, service_role;

create or replace function public.otp_refresh_pending(
  p_id uuid,
  p_otp_hash text,
  p_otp_code text,
  p_expires_at timestamptz,
  p_last_sent_at timestamptz,
  p_resend_count integer,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.phone_otp_verifications
  set otp_hash = p_otp_hash,
      otp_code = p_otp_code,
      expires_at = p_expires_at,
      last_sent_at = p_last_sent_at,
      resend_count = p_resend_count,
      attempt_count = 0,
      metadata = coalesce(p_metadata, metadata, '{}'::jsonb),
      updated_at = now()
  where id = p_id;
end;
$$;
revoke all on function public.otp_refresh_pending(uuid, text, text, timestamptz, timestamptz, integer, jsonb) from public;
grant execute on function public.otp_refresh_pending(uuid, text, text, timestamptz, timestamptz, integer, jsonb) to anon, authenticated, service_role;

create or replace function public.otp_bump_attempt(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.phone_otp_verifications
  set attempt_count = attempt_count + 1,
      updated_at = now()
  where id = p_id;
$$;
revoke all on function public.otp_bump_attempt(uuid) from public;
grant execute on function public.otp_bump_attempt(uuid) to anon, authenticated, service_role;

create or replace function public.otp_mark_status(p_id uuid, p_status text, p_verified_at timestamptz default null)
returns void
language sql
security definer
set search_path = public
as $$
  update public.phone_otp_verifications
  set status = p_status,
      verified_at = case when p_status = 'verified' then coalesce(p_verified_at, now()) else verified_at end,
      updated_at = now()
  where id = p_id;
$$;
revoke all on function public.otp_mark_status(uuid, text, timestamptz) from public;
grant execute on function public.otp_mark_status(uuid, text, timestamptz) to anon, authenticated, service_role;
