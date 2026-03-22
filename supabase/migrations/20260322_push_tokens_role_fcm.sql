-- push_register API bilan mos: role, app_version (ixtiyoriy)
begin;

alter table if exists public.push_tokens
  add column if not exists role text;

alter table if exists public.push_tokens
  add column if not exists app_version text;

commit;
