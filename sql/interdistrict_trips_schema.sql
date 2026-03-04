-- Inter-district (Tumanlar aro) trips + pitaks + requests
-- Safe to run multiple times.

create table if not exists public.district_pitaks (
  id uuid primary key default gen_random_uuid(),
  region text not null,
  from_district text not null,
  to_district text not null,
  title text not null,
  location_point jsonb null, -- {lat,lng} optional
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.district_trips (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null, -- auth.users.id
  region text not null,
  from_district text not null,
  to_district text not null,

  tariff text not null check (tariff in ('pitak','door')),
  pitak_id uuid null references public.district_pitaks(id) on delete set null,

  -- door-to-door optional precise points
  from_point jsonb null,
  to_point jsonb null,

  depart_at timestamptz not null,

  seats_total int null,
  allow_full_salon boolean not null default false,

  base_price_uzs int not null,
  pickup_fee_uzs int not null default 0,
  dropoff_fee_uzs int not null default 0,
  full_salon_price_uzs int null,

  has_ac boolean not null default false,
  has_trunk boolean not null default false,
  is_lux boolean not null default false,
  allow_smoking boolean not null default false,

  has_delivery boolean not null default false,
  delivery_price_uzs int null,

  notes text null,

  status text not null default 'active' check (status in ('active','paused','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.district_trip_requests (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.district_trips(id) on delete cascade,
  passenger_id uuid not null, -- auth.users.id

  seats_requested int null,
  wants_full_salon boolean not null default false,

  -- door-to-door passenger addresses (optional)
  pickup_address text null,
  dropoff_address text null,
  pickup_point jsonb null,
  dropoff_point jsonb null,

  -- delivery
  is_delivery boolean not null default false,
  delivery_notes text null,

  status text not null default 'pending' check (status in ('pending','accepted','rejected','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Realtime publication (optional): do not fail if no privileges
do $$ begin
  begin
    alter publication supabase_realtime add table public.district_trips;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.district_trip_requests;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.district_pitaks;
  exception when others then null;
  end;
end $$;

-- RLS
alter table public.district_pitaks enable row level security;
alter table public.district_trips enable row level security;
alter table public.district_trip_requests enable row level security;

-- Policies (idempotent)
do $$ begin
  -- pitaks: everyone can read active
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='district_pitaks' and policyname='pitaks_select') then
    create policy pitaks_select on public.district_pitaks
      for select using (true);
  end if;

  -- pitaks: only authenticated can insert/update/delete (admin panel can use service role)
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='district_pitaks' and policyname='pitaks_write') then
    create policy pitaks_write on public.district_pitaks
      for all to authenticated
      using (true)
      with check (true);
  end if;

  -- trips: everyone can read active
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='district_trips' and policyname='trips_select') then
    create policy trips_select on public.district_trips
      for select using (true);
  end if;

  -- trips: driver owns write
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='district_trips' and policyname='trips_driver_write') then
    create policy trips_driver_write on public.district_trips
      for all to authenticated
      using (auth.uid() = driver_id)
      with check (auth.uid() = driver_id);
  end if;

  -- requests: passenger can insert/select own
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='district_trip_requests' and policyname='requests_passenger_rw') then
    create policy requests_passenger_rw on public.district_trip_requests
      for all to authenticated
      using (auth.uid() = passenger_id)
      with check (auth.uid() = passenger_id);
  end if;

  -- requests: driver can read/respond on requests for own trips
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='district_trip_requests' and policyname='requests_driver_select_update') then
    create policy requests_driver_select_update on public.district_trip_requests
      for select to authenticated
      using (exists (select 1 from public.district_trips t where t.id = trip_id and t.driver_id = auth.uid()));
    create policy requests_driver_update on public.district_trip_requests
      for update to authenticated
      using (exists (select 1 from public.district_trips t where t.id = trip_id and t.driver_id = auth.uid()))
      with check (exists (select 1 from public.district_trips t where t.id = trip_id and t.driver_id = auth.uid()));
  end if;
end $$;
