alter table public.drivers
add column if not exists location geography(point,4326);

alter table public.drivers
add column if not exists last_seen timestamptz;

create index if not exists idx_drivers_location
on public.drivers
using gist(location);

create index if not exists idx_drivers_last_seen
on public.drivers(last_seen desc);
