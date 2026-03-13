
-- Phase 9: Geo index for drivers

create extension if not exists cube;
create extension if not exists earthdistance;

alter table if exists driver_presence
add column if not exists geo_point point;

update driver_presence
set geo_point = point(lng,lat)
where lat is not null and lng is not null;

create index if not exists idx_driver_geo
on driver_presence using gist(geo_point);
