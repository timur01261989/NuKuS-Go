begin;

create extension if not exists pgcrypto;

create or replace function public.generate_referral_code_safe(p_seed text)
returns text
language plpgsql
as $$
declare
  v_seed text := regexp_replace(upper(coalesce(p_seed, 'UNI')), '[^A-Z0-9]', '', 'g');
  v_code text;
  v_try int := 0;
begin
  if v_seed = '' then
    v_seed := 'UNI';
  end if;

  loop
    v_try := v_try + 1;
    v_code := left(v_seed, 6) || substr(upper(encode(gen_random_bytes(4), 'hex')), 1, 6);
    exit when not exists (
      select 1 from public.referral_codes where code = v_code
    ) or v_try > 50;
  end loop;

  return left(v_code, 12);
end;
$$;

insert into public.referral_codes (user_id, code, is_active)
select
  p.id,
  public.generate_referral_code_safe(coalesce(p.phone, p.id::text)),
  true
from public.profiles p
left join public.referral_codes rc on rc.user_id = p.id
where rc.user_id is null
on conflict (user_id) do nothing;

commit;
