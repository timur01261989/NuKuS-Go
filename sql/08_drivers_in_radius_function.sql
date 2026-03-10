create or replace function public.drivers_in_radius(
 lat float,
 lng float,
 radius float
)
returns setof public.drivers
language sql
as $$
 select *
 from public.drivers
 where location is not null
   and ST_DWithin(
     location,
     ST_SetSRID(ST_MakePoint(lng,lat),4326)::geography,
     radius
   )
   and coalesce(last_seen, now() - interval '1 hour') > now() - interval '30 seconds';
$$;
