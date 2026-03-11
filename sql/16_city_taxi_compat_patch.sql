-- Phase 16: city taxi compatibility patch for frontend/backend contract
-- Purpose:
-- 1) add compatibility columns used by the current taxi order API
-- 2) keep the unified orders table as the source of truth
-- 3) avoid repeated schema-cache errors for car_type/comment/distance_m/etc.

alter table public.orders
add column if not exists car_type text,
add column if not exists comment text,
add column if not exists distance_m integer,
add column if not exists duration_s integer,
add column if not exists surge_multiplier numeric(8,2) not null default 1,
add column if not exists options jsonb not null default '{}'::jsonb,
add column if not exists pickup_lat double precision,
add column if not exists pickup_lng double precision,
add column if not exists dropoff_lat double precision,
add column if not exists dropoff_lng double precision;

-- Keep denormalized compatibility columns in sync with pickup/dropoff jsonb.
update public.orders
set
  pickup_lat = coalesce(pickup_lat, nullif(pickup->>'lat','')::double precision),
  pickup_lng = coalesce(pickup_lng, nullif(pickup->>'lng','')::double precision),
  dropoff_lat = coalesce(dropoff_lat, nullif(dropoff->>'lat','')::double precision),
  dropoff_lng = coalesce(dropoff_lng, nullif(dropoff->>'lng','')::double precision),
  comment = coalesce(comment, note)
where true;

create or replace function public.sync_order_compat_columns()
returns trigger
language plpgsql
as $$
begin
  if new.pickup is not null then
    new.pickup_lat := coalesce(new.pickup_lat, nullif(new.pickup->>'lat','')::double precision);
    new.pickup_lng := coalesce(new.pickup_lng, nullif(new.pickup->>'lng','')::double precision);
  end if;

  if new.dropoff is not null then
    new.dropoff_lat := coalesce(new.dropoff_lat, nullif(new.dropoff->>'lat','')::double precision);
    new.dropoff_lng := coalesce(new.dropoff_lng, nullif(new.dropoff->>'lng','')::double precision);
  end if;

  if new.comment is null then
    new.comment := new.note;
  end if;

  if new.surge_multiplier is null then
    new.surge_multiplier := 1;
  end if;

  if new.options is null then
    new.options := '{}'::jsonb;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_orders_sync_compat_columns on public.orders;
create trigger trg_orders_sync_compat_columns
before insert or update on public.orders
for each row execute function public.sync_order_compat_columns();

create index if not exists idx_orders_car_type on public.orders(car_type);
create index if not exists idx_orders_distance_m on public.orders(distance_m);
create index if not exists idx_orders_pickup_coords on public.orders(pickup_lat, pickup_lng);
create index if not exists idx_orders_dropoff_coords on public.orders(dropoff_lat, dropoff_lng);

comment on column public.orders.car_type is 'Client taxi tariff: start | komfort | biznes';
comment on column public.orders.comment is 'Compatibility comment field used by the current taxi client. Mirrors note when missing.';
comment on column public.orders.distance_m is 'Compatibility distance in meters for current taxi order flow.';
comment on column public.orders.duration_s is 'Compatibility duration in seconds for current taxi order flow.';
comment on column public.orders.surge_multiplier is 'Dynamic tariff multiplier used by surge pricing.';
comment on column public.orders.options is 'Additional taxi options payload stored as jsonb.';
