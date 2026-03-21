create or replace function public.normalize_phone_e164(p_phone text)
returns text
language plpgsql
immutable
as $$
declare
  v_digits text;
begin
  v_digits := regexp_replace(coalesce(p_phone, ''), '\\D', '', 'g');

  if length(v_digits) = 12 and left(v_digits, 3) = '998' then
    return '+' || v_digits;
  elsif length(v_digits) = 9 then
    return '+998' || v_digits;
  else
    return trim(coalesce(p_phone, ''));
  end if;
end;
$$;

create or replace function public.find_profile_by_phone_for_otp(p_phone text)
returns table (
  exists_profile boolean,
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
  v_has_phone boolean;
  v_has_phone_normalized boolean;
  v_has_user_id boolean;
begin
  v_phone := public.normalize_phone_e164(p_phone);

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'phone'
  ) into v_has_phone;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'phone_normalized'
  ) into v_has_phone_normalized;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'user_id'
  ) into v_has_user_id;

  if v_has_phone and v_has_phone_normalized and v_has_user_id then
    execute $sql$
      select p.id, p.user_id, coalesce(p.phone_normalized, p.phone)
      from public.profiles p
      where p.phone_normalized = $1 or p.phone = $1
      order by p.created_at desc nulls last, p.id desc
      limit 1
    $sql$
    into v_profile_id, v_auth_user_id, v_matched_phone
    using v_phone;
  elsif v_has_phone and v_has_phone_normalized then
    execute $sql$
      select p.id, p.id, coalesce(p.phone_normalized, p.phone)
      from public.profiles p
      where p.phone_normalized = $1 or p.phone = $1
      order by p.created_at desc nulls last, p.id desc
      limit 1
    $sql$
    into v_profile_id, v_auth_user_id, v_matched_phone
    using v_phone;
  elsif v_has_phone then
    execute $sql$
      select p.id, p.id, p.phone
      from public.profiles p
      where p.phone = $1
      order by p.created_at desc nulls last, p.id desc
      limit 1
    $sql$
    into v_profile_id, v_auth_user_id, v_matched_phone
    using v_phone;
  else
    v_profile_id := null;
    v_auth_user_id := null;
    v_matched_phone := null;
  end if;

  if v_profile_id is null then
    select u.id, u.phone
    into v_auth_user_id, v_matched_phone
    from auth.users u
    where u.phone = v_phone
    order by u.created_at desc
    limit 1;
  end if;

  return query
  select
    (v_profile_id is not null or v_auth_user_id is not null) as exists_profile,
    v_profile_id,
    v_auth_user_id,
    v_matched_phone;
end;
$$;

revoke all on function public.find_profile_by_phone_for_otp(text) from public;
grant execute on function public.find_profile_by_phone_for_otp(text) to service_role;

create or replace function public.upsert_profile_after_phone_signup(
  p_user_id uuid,
  p_phone text,
  p_first_name text default null,
  p_last_name text default null,
  p_referral_code text default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_phone text;
  v_has_user_id boolean;
  v_has_phone boolean;
  v_has_phone_normalized boolean;
  v_has_first_name boolean;
  v_has_last_name boolean;
  v_has_referral_code boolean;
  v_has_created_at boolean;
  v_has_updated_at boolean;
  v_sql text;
  v_columns text[] := array['id'];
  v_values text[] := array['$1'];
  v_updates text[] := array[]::text[];
  v_index integer := 1;
begin
  v_phone := public.normalize_phone_e164(p_phone);

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'user_id'
  ) into v_has_user_id;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'phone'
  ) into v_has_phone;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'phone_normalized'
  ) into v_has_phone_normalized;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'first_name'
  ) into v_has_first_name;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'last_name'
  ) into v_has_last_name;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'referral_code'
  ) into v_has_referral_code;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'created_at'
  ) into v_has_created_at;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'updated_at'
  ) into v_has_updated_at;

  if v_has_user_id then
    v_index := v_index + 1;
    v_columns := array_append(v_columns, 'user_id');
    v_values := array_append(v_values, format('$%s', v_index));
    v_updates := array_append(v_updates, 'user_id = excluded.user_id');
  end if;

  if v_has_phone then
    v_index := v_index + 1;
    v_columns := array_append(v_columns, 'phone');
    v_values := array_append(v_values, format('$%s', v_index));
    v_updates := array_append(v_updates, 'phone = excluded.phone');
  end if;

  if v_has_phone_normalized then
    v_index := v_index + 1;
    v_columns := array_append(v_columns, 'phone_normalized');
    v_values := array_append(v_values, format('$%s', v_index));
    v_updates := array_append(v_updates, 'phone_normalized = excluded.phone_normalized');
  end if;

  if v_has_first_name then
    v_index := v_index + 1;
    v_columns := array_append(v_columns, 'first_name');
    v_values := array_append(v_values, format('$%s', v_index));
    v_updates := array_append(v_updates, 'first_name = excluded.first_name');
  end if;

  if v_has_last_name then
    v_index := v_index + 1;
    v_columns := array_append(v_columns, 'last_name');
    v_values := array_append(v_values, format('$%s', v_index));
    v_updates := array_append(v_updates, 'last_name = excluded.last_name');
  end if;

  if v_has_referral_code then
    v_index := v_index + 1;
    v_columns := array_append(v_columns, 'referral_code');
    v_values := array_append(v_values, format('$%s', v_index));
    v_updates := array_append(v_updates, 'referral_code = excluded.referral_code');
  end if;

  if v_has_created_at then
    v_columns := array_append(v_columns, 'created_at');
    v_values := array_append(v_values, 'now()');
  end if;

  if v_has_updated_at then
    v_columns := array_append(v_columns, 'updated_at');
    v_values := array_append(v_values, 'now()');
    v_updates := array_append(v_updates, 'updated_at = now()');
  end if;

  v_sql := format(
    'insert into public.profiles (%s) values (%s) on conflict (id) do update set %s',
    array_to_string(v_columns, ', '),
    array_to_string(v_values, ', '),
    case when array_length(v_updates, 1) is null then 'id = excluded.id' else array_to_string(v_updates, ', ') end
  );

  if v_has_user_id and v_has_phone and v_has_phone_normalized and v_has_first_name and v_has_last_name and v_has_referral_code then
    execute v_sql using p_user_id, p_user_id, v_phone, v_phone, p_first_name, p_last_name, p_referral_code;
  elsif v_has_user_id and v_has_phone and v_has_phone_normalized and v_has_first_name and v_has_last_name then
    execute v_sql using p_user_id, p_user_id, v_phone, v_phone, p_first_name, p_last_name;
  elsif v_has_user_id and v_has_phone and v_has_phone_normalized and v_has_first_name then
    execute v_sql using p_user_id, p_user_id, v_phone, v_phone, p_first_name;
  elsif v_has_user_id and v_has_phone and v_has_phone_normalized then
    execute v_sql using p_user_id, p_user_id, v_phone, v_phone;
  elsif v_has_user_id and v_has_phone then
    execute v_sql using p_user_id, p_user_id, v_phone;
  elsif v_has_phone then
    execute v_sql using p_user_id, v_phone;
  else
    execute v_sql using p_user_id;
  end if;
end;
$$;

revoke all on function public.upsert_profile_after_phone_signup(uuid, text, text, text, text) from public;
grant execute on function public.upsert_profile_after_phone_signup(uuid, text, text, text, text) to service_role;
