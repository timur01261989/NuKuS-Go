begin;

alter table if exists public.profiles
  add column if not exists active_vehicle_id uuid references public.vehicles(id) on delete set null;

create index if not exists profiles_active_vehicle_id_idx on public.profiles(active_vehicle_id);

commit;
