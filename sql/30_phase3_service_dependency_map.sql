-- UniGo 3-bosqich: frontend/backend mapping metadata
-- Bu script data o'chirmaydi. Faqat mapping metadata yaratadi.

create schema if not exists app_meta;

create table if not exists app_meta.service_dependency_map (
  id bigserial primary key,
  layer text not null check (layer in ('frontend', 'backend', 'core', 'service')),
  component_name text not null,
  canonical_table text not null,
  secondary_tables text[],
  service_scope text,
  write_mode text,
  read_mode text,
  notes text,
  updated_at timestamptz not null default now()
);

create or replace function app_meta.touch_service_dependency_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_service_dependency_map_updated_at on app_meta.service_dependency_map;
create trigger trg_service_dependency_map_updated_at
before update on app_meta.service_dependency_map
for each row
execute function app_meta.touch_service_dependency_updated_at();

delete from app_meta.service_dependency_map
where component_name in (
  'DriverDashboard',
  'DriverSettingsPage',
  'VehiclesPage',
  'DriverHome',
  'DriverDelivery',
  'DriverFreight',
  'InterDistrictPage',
  'InterProvincialPage',
  'CityTaxiFlow',
  'DeliveryFlow',
  'FreightFlow',
  'InterdistrictFlow',
  'IntercityFlow'
);

insert into app_meta.service_dependency_map
(layer, component_name, canonical_table, secondary_tables, service_scope, write_mode, read_mode, notes)
values
('frontend', 'DriverDashboard', 'profiles', ARRAY['driver_service_settings','vehicles','driver_presence'], 'driver', 'read_only', 'core_read', 'Dashboard only reads driver core state'),
('frontend', 'DriverSettingsPage', 'driver_service_settings', ARRAY['profiles','vehicles','vehicle_change_requests'], 'driver', 'update', 'core_read_write', 'Driver settings source of truth'),
('frontend', 'VehiclesPage', 'vehicles', ARRAY['vehicle_change_requests','profiles'], 'driver', 'request_write', 'core_read_write', 'Vehicles and active vehicle selection'),
('frontend', 'DriverHome', 'profiles', ARRAY['driver_service_settings','vehicles','driver_presence'], 'driver', 'presence_update', 'core_read', 'Home uses only driver core'),
('frontend', 'DriverDelivery', 'delivery_orders', ARRAY['profiles','driver_service_settings','vehicles'], 'delivery', 'service_write', 'service_primary', 'Delivery reads delivery_orders but capability from driver core'),
('frontend', 'DriverFreight', 'cargo_orders', ARRAY['cargo_offers','cargo_feed','profiles','driver_service_settings','vehicles'], 'freight', 'service_write', 'service_primary', 'Freight reads cargo tables but capability from driver core'),
('frontend', 'InterDistrictPage', 'district_trips', ARRAY['district_trip_requests','district_bookings','profiles','driver_service_settings','vehicles'], 'interdistrict', 'service_write', 'service_primary', 'Interdistrict reads district service tables'),
('frontend', 'InterProvincialPage', 'interprov_trips', ARRAY['interprov_bookings','inter_prov_seat_requests','intercity_bookings','profiles','driver_service_settings','vehicles'], 'intercity', 'service_write', 'service_primary', 'Intercity reads canonical interprov tables'),
('backend', 'CityTaxiFlow', 'city_taxi_orders', ARRAY['orders'], 'city', 'service_write', 'service_primary', 'Orders may later unify into orders'),
('backend', 'DeliveryFlow', 'delivery_orders', ARRAY['orders'], 'delivery', 'service_write', 'service_primary', 'Delivery remains on delivery_orders during migration'),
('backend', 'FreightFlow', 'cargo_orders', ARRAY['cargo_offers','cargo_feed','cargo_status_events','cargo_tracking_points'], 'freight', 'service_write', 'service_primary', 'Freight remains on cargo tables during migration'),
('backend', 'InterdistrictFlow', 'district_trips', ARRAY['district_trip_requests','district_bookings','district_routes','district_pitaks'], 'interdistrict', 'service_write', 'service_primary', 'Interdistrict remains on district tables during migration'),
('backend', 'IntercityFlow', 'interprov_trips', ARRAY['interprov_bookings','inter_prov_seat_requests','intercity_bookings','intercity_routes'], 'intercity', 'service_write', 'service_primary', 'Intercity remains on interprov tables during migration');

create or replace view app_meta.v_service_dependency_map as
select
  layer,
  component_name,
  canonical_table,
  secondary_tables,
  service_scope,
  write_mode,
  read_mode,
  notes
from app_meta.service_dependency_map
order by
  case layer when 'frontend' then 1 when 'backend' then 2 when 'core' then 3 when 'service' then 4 else 5 end,
  component_name;

create or replace view app_meta.v_legacy_cutover_plan as
select *
from (
  values
    ('drivers', 'profiles + driver_applications', 'Stop frontend reads first, then stop backend writes, then drop later'),
    ('driver_profiles', 'profiles', 'Move any remaining profile reads to profiles, then mark legacy dead'),
    ('inter_prov_trips', 'interprov_trips', 'Replace all reads/writes with interprov_trips before cleanup'),
    ('transactions', 'wallet_transactions', 'Stop wallet UI and ledger reads from transactions first'),
    ('billing_transactions', 'wallet_transactions', 'Move billing history UI to wallet_transactions or dedicated billing layer')
) as t(legacy_table, replacement, cutover_steps);
