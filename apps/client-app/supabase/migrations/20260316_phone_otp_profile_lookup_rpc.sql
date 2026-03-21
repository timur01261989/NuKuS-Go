create or replace function public.find_profile_by_phone(p_phone text)
returns table (
  id uuid,
  phone text,
  phone_normalized text
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.phone,
    p.phone_normalized
  from public.profiles as p
  where p.phone_normalized = p_phone
     or p.phone = p_phone
  order by case when p.phone_normalized = p_phone then 0 else 1 end
  limit 1;
$$;

revoke all on function public.find_profile_by_phone(text) from public;
grant execute on function public.find_profile_by_phone(text) to anon;
grant execute on function public.find_profile_by_phone(text) to authenticated;
grant execute on function public.find_profile_by_phone(text) to service_role;
