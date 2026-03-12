alter table if exists public.inter_prov_trips add column if not exists is_airport_transfer boolean not null default false;
alter table if exists public.inter_prov_trips add column if not exists flight_number text null;
alter table if exists public.inter_prov_trips add column if not exists arrival_time timestamptz null;
alter table if exists public.inter_prov_trips add column if not exists terminal text null;
alter table if exists public.inter_prov_trips add column if not exists waiting_policy jsonb not null default '{}'::jsonb;
alter table if exists public.inter_prov_trips add column if not exists amenities jsonb not null default '{}'::jsonb;
alter table if exists public.inter_prov_trips add column if not exists child_seat_types text[] not null default '{}';
alter table if exists public.inter_prov_trips add column if not exists wheelchair_accessible boolean not null default false;
alter table if exists public.inter_prov_trips add column if not exists meet_greet boolean not null default false;
