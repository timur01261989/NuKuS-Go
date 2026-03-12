-- Unified user_id migration for intercity / interdistrict / delivery / freight

alter table if exists public.inter_prov_trips add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table if exists public.inter_prov_trips add column if not exists from_district text;
alter table if exists public.inter_prov_trips add column if not exists to_district text;
alter table if exists public.inter_prov_trips add column if not exists depart_at timestamptz;
alter table if exists public.inter_prov_trips add column if not exists seats_total int;
alter table if exists public.inter_prov_trips add column if not exists seats_available int;
alter table if exists public.inter_prov_trips add column if not exists updated_at timestamptz not null default now();
update public.inter_prov_trips set user_id = coalesce(user_id, driver_id) where user_id is null and driver_id is not null;

alter table if exists public.inter_prov_seat_requests add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table if exists public.inter_prov_seat_requests add column if not exists notes text;
alter table if exists public.inter_prov_seat_requests add column if not exists hold_id text;
alter table if exists public.inter_prov_seat_requests add column if not exists updated_at timestamptz not null default now();
update public.inter_prov_seat_requests set user_id = coalesce(user_id, client_id) where user_id is null and client_id is not null;

alter table if exists public.district_trips add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table if exists public.district_trips add column if not exists tariff text;
alter table if exists public.district_trips add column if not exists pitak_id uuid;
alter table if exists public.district_trips add column if not exists from_point jsonb;
alter table if exists public.district_trips add column if not exists to_point jsonb;
alter table if exists public.district_trips add column if not exists meeting_points jsonb not null default '[]'::jsonb;
alter table if exists public.district_trips add column if not exists route_polyline jsonb not null default '[]'::jsonb;
alter table if exists public.district_trips add column if not exists depart_at timestamptz;
alter table if exists public.district_trips add column if not exists seats_total int;
alter table if exists public.district_trips add column if not exists allow_full_salon boolean not null default false;
alter table if exists public.district_trips add column if not exists base_price_uzs bigint;
alter table if exists public.district_trips add column if not exists pickup_fee_uzs bigint;
alter table if exists public.district_trips add column if not exists dropoff_fee_uzs bigint;
alter table if exists public.district_trips add column if not exists waiting_fee_uzs bigint;
alter table if exists public.district_trips add column if not exists full_salon_price_uzs bigint;
alter table if exists public.district_trips add column if not exists has_ac boolean not null default false;
alter table if exists public.district_trips add column if not exists has_trunk boolean not null default false;
alter table if exists public.district_trips add column if not exists is_lux boolean not null default false;
alter table if exists public.district_trips add column if not exists allow_smoking boolean not null default false;
alter table if exists public.district_trips add column if not exists has_delivery boolean not null default false;
alter table if exists public.district_trips add column if not exists delivery_price_uzs bigint;
alter table if exists public.district_trips add column if not exists notes text;
alter table if exists public.district_trips add column if not exists women_only boolean not null default false;
alter table if exists public.district_trips add column if not exists booking_mode text;
alter table if exists public.district_trips add column if not exists updated_at timestamptz not null default now();
update public.district_trips set user_id = coalesce(user_id, driver_id) where user_id is null and driver_id is not null;

alter table if exists public.district_trip_requests add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table if exists public.district_trip_requests add column if not exists seats_requested int;
alter table if exists public.district_trip_requests add column if not exists wants_full_salon boolean not null default false;
alter table if exists public.district_trip_requests add column if not exists pickup_address text;
alter table if exists public.district_trip_requests add column if not exists dropoff_address text;
alter table if exists public.district_trip_requests add column if not exists pickup_point jsonb;
alter table if exists public.district_trip_requests add column if not exists dropoff_point jsonb;
alter table if exists public.district_trip_requests add column if not exists meeting_point_id uuid;
alter table if exists public.district_trip_requests add column if not exists is_delivery boolean not null default false;
alter table if exists public.district_trip_requests add column if not exists delivery_notes text;
alter table if exists public.district_trip_requests add column if not exists weight_category text;
alter table if exists public.district_trip_requests add column if not exists payment_method text;
alter table if exists public.district_trip_requests add column if not exists final_price bigint;
alter table if exists public.district_trip_requests add column if not exists selected_seats jsonb not null default '[]'::jsonb;
alter table if exists public.district_trip_requests add column if not exists accepted_at timestamptz;
alter table if exists public.district_trip_requests add column if not exists rejected_at timestamptz;
alter table if exists public.district_trip_requests add column if not exists responded_at timestamptz;
alter table if exists public.district_trip_requests add column if not exists updated_at timestamptz not null default now();
update public.district_trip_requests set user_id = coalesce(user_id, client_id) where user_id is null and client_id is not null;

alter table if exists public.district_pitaks add column if not exists region text;
alter table if exists public.district_pitaks add column if not exists from_district text;
alter table if exists public.district_pitaks add column if not exists to_district text;
alter table if exists public.district_pitaks add column if not exists location_point jsonb;
alter table if exists public.district_pitaks add column if not exists is_active boolean not null default true;
alter table if exists public.district_pitaks add column if not exists updated_at timestamptz not null default now();

alter table if exists public.delivery_orders add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table if exists public.delivery_orders add column if not exists driver_user_id uuid references public.profiles(id) on delete set null;
alter table if exists public.delivery_orders add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table if exists public.delivery_orders add column if not exists service_mode text default 'city';
alter table if exists public.delivery_orders add column if not exists parcel_type text;
alter table if exists public.delivery_orders add column if not exists parcel_label text;
alter table if exists public.delivery_orders add column if not exists weight_kg numeric(10,2) default 0;
alter table if exists public.delivery_orders add column if not exists price bigint default 0;
alter table if exists public.delivery_orders add column if not exists commission_amount bigint default 0;
alter table if exists public.delivery_orders add column if not exists payment_method text;
alter table if exists public.delivery_orders add column if not exists comment text;
alter table if exists public.delivery_orders add column if not exists receiver_name text;
alter table if exists public.delivery_orders add column if not exists receiver_phone text;
alter table if exists public.delivery_orders add column if not exists sender_phone text;
alter table if exists public.delivery_orders add column if not exists pickup_mode text;
alter table if exists public.delivery_orders add column if not exists dropoff_mode text;
alter table if exists public.delivery_orders add column if not exists pickup_region text;
alter table if exists public.delivery_orders add column if not exists pickup_district text;
alter table if exists public.delivery_orders add column if not exists pickup_label text;
alter table if exists public.delivery_orders add column if not exists pickup_lat double precision;
alter table if exists public.delivery_orders add column if not exists pickup_lng double precision;
alter table if exists public.delivery_orders add column if not exists dropoff_region text;
alter table if exists public.delivery_orders add column if not exists dropoff_district text;
alter table if exists public.delivery_orders add column if not exists dropoff_label text;
alter table if exists public.delivery_orders add column if not exists dropoff_lat double precision;
alter table if exists public.delivery_orders add column if not exists dropoff_lng double precision;
alter table if exists public.delivery_orders add column if not exists matched_trip_id uuid references public.inter_prov_trips(id) on delete set null;
alter table if exists public.delivery_orders add column if not exists matched_trip_title text;
alter table if exists public.delivery_orders add column if not exists matched_driver_user_id uuid references public.profiles(id) on delete set null;
alter table if exists public.delivery_orders add column if not exists matched_driver_name text;
alter table if exists public.delivery_orders add column if not exists history jsonb not null default '[]'::jsonb;
update public.delivery_orders set user_id = coalesce(user_id, client_id, created_by) where user_id is null;
update public.delivery_orders set driver_user_id = coalesce(driver_user_id, driver_id) where driver_user_id is null and driver_id is not null;

alter table if exists public.cargo_orders add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table if exists public.cargo_orders add column if not exists driver_user_id uuid references public.profiles(id) on delete set null;
alter table if exists public.cargo_orders add column if not exists title text;
alter table if exists public.cargo_orders add column if not exists description text;
alter table if exists public.cargo_orders add column if not exists cargo_type text;
alter table if exists public.cargo_orders add column if not exists volume_m3 numeric(10,2);
alter table if exists public.cargo_orders add column if not exists budget bigint;
alter table if exists public.cargo_orders add column if not exists from_address text;
alter table if exists public.cargo_orders add column if not exists to_address text;
alter table if exists public.cargo_orders add column if not exists from_point text;
alter table if exists public.cargo_orders add column if not exists to_point text;
alter table if exists public.cargo_orders add column if not exists pickup_at timestamptz;
alter table if exists public.cargo_orders add column if not exists selected_offer_id uuid;
update public.cargo_orders set user_id = coalesce(user_id, client_id) where user_id is null and client_id is not null;
update public.cargo_orders set driver_user_id = coalesce(driver_user_id, driver_id) where driver_user_id is null and driver_id is not null;

alter table if exists public.cargo_offers add column if not exists cargo_id uuid references public.cargo_orders(id) on delete cascade;
alter table if exists public.cargo_offers add column if not exists driver_user_id uuid references public.profiles(id) on delete cascade;
alter table if exists public.cargo_offers add column if not exists vehicle_id uuid references public.vehicles(id) on delete set null;
alter table if exists public.cargo_offers add column if not exists price bigint;
alter table if exists public.cargo_offers add column if not exists eta_minutes int;
alter table if exists public.cargo_offers add column if not exists note text;
update public.cargo_offers set cargo_id = coalesce(cargo_id, cargo_order_id) where cargo_id is null and cargo_order_id is not null;
update public.cargo_offers set driver_user_id = coalesce(driver_user_id, driver_id) where driver_user_id is null and driver_id is not null;

alter table if exists public.cargo_status_events add column if not exists cargo_id uuid references public.cargo_orders(id) on delete cascade;
alter table if exists public.cargo_status_events add column if not exists actor_id uuid references public.profiles(id) on delete set null;
alter table if exists public.cargo_status_events add column if not exists note text;
update public.cargo_status_events set cargo_id = coalesce(cargo_id, cargo_order_id) where cargo_id is null and cargo_order_id is not null;

alter table if exists public.cargo_tracking_points add column if not exists cargo_id uuid references public.cargo_orders(id) on delete cascade;
update public.cargo_tracking_points set cargo_id = coalesce(cargo_id, cargo_order_id) where cargo_id is null and cargo_order_id is not null;

create index if not exists inter_prov_seat_requests_user_id_idx on public.inter_prov_seat_requests(user_id, created_at desc);
create index if not exists district_trip_requests_user_id_idx on public.district_trip_requests(user_id, created_at desc);
create index if not exists delivery_orders_user_id_idx on public.delivery_orders(user_id, created_at desc);
create index if not exists cargo_orders_user_id_idx on public.cargo_orders(user_id, created_at desc);

alter table if exists public.inter_prov_seat_requests enable row level security;
alter table if exists public.district_trip_requests enable row level security;
alter table if exists public.delivery_orders enable row level security;
alter table if exists public.cargo_orders enable row level security;

drop policy if exists inter_prov_seat_requests_select_own on public.inter_prov_seat_requests;
drop policy if exists inter_prov_seat_requests_insert_own on public.inter_prov_seat_requests;
drop policy if exists inter_prov_seat_requests_update_own on public.inter_prov_seat_requests;
create policy inter_prov_seat_requests_select_own on public.inter_prov_seat_requests for select to authenticated using (user_id = auth.uid());
create policy inter_prov_seat_requests_insert_own on public.inter_prov_seat_requests for insert to authenticated with check (user_id = auth.uid());
create policy inter_prov_seat_requests_update_own on public.inter_prov_seat_requests for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists district_trip_requests_select_own on public.district_trip_requests;
drop policy if exists district_trip_requests_insert_own on public.district_trip_requests;
drop policy if exists district_trip_requests_update_own on public.district_trip_requests;
create policy district_trip_requests_select_own on public.district_trip_requests for select to authenticated using (user_id = auth.uid());
create policy district_trip_requests_insert_own on public.district_trip_requests for insert to authenticated with check (user_id = auth.uid());
create policy district_trip_requests_update_own on public.district_trip_requests for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists delivery_orders_select_own on public.delivery_orders;
drop policy if exists delivery_orders_insert_own on public.delivery_orders;
drop policy if exists delivery_orders_update_own on public.delivery_orders;
create policy delivery_orders_select_own on public.delivery_orders for select to authenticated using (user_id = auth.uid() or driver_user_id = auth.uid());
create policy delivery_orders_insert_own on public.delivery_orders for insert to authenticated with check (user_id = auth.uid());
create policy delivery_orders_update_own on public.delivery_orders for update to authenticated using (user_id = auth.uid() or driver_user_id = auth.uid()) with check (user_id = auth.uid() or driver_user_id = auth.uid());

drop policy if exists cargo_orders_select_own on public.cargo_orders;
drop policy if exists cargo_orders_insert_own on public.cargo_orders;
drop policy if exists cargo_orders_update_own on public.cargo_orders;
create policy cargo_orders_select_own on public.cargo_orders for select to authenticated using (user_id = auth.uid() or driver_user_id = auth.uid());
create policy cargo_orders_insert_own on public.cargo_orders for insert to authenticated with check (user_id = auth.uid());
create policy cargo_orders_update_own on public.cargo_orders for update to authenticated using (user_id = auth.uid() or driver_user_id = auth.uid()) with check (user_id = auth.uid() or driver_user_id = auth.uid());
