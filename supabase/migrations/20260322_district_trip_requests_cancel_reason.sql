begin;

alter table if exists public.district_trip_requests
  add column if not exists cancel_reason text;

commit;
