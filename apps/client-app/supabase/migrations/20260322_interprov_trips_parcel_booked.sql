-- interprov_trips: mijoz intercitySupabase va API list_offers uchun qo‘shimcha maydonlar
begin;

alter table if exists public.interprov_trips
  add column if not exists parcel_enabled boolean not null default false;

alter table if exists public.interprov_trips
  add column if not exists booked_seats int not null default 0;

create index if not exists idx_interprov_trips_list
  on public.interprov_trips (status, depart_at asc)
  where status in ('active', 'draft');

commit;
