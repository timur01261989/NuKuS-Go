-- UniGo 2-bosqich: jadval klassifikatsiyasi va legacy belgilash
-- Bu script hech narsani o‘chirmaydi.
-- Faqat metadata comment va helper view yaratadi.

create schema if not exists app_meta;

create table if not exists app_meta.table_classification (
  table_name text primary key,
  classification text not null check (classification in ('core', 'service_primary', 'legacy', 'drop_later')),
  service_scope text,
  keep_reason text,
  notes text,
  updated_at timestamptz not null default now()
);

create or replace function app_meta.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_table_classification_updated_at on app_meta.table_classification;
create trigger trg_table_classification_updated_at
before update on app_meta.table_classification
for each row
execute function app_meta.touch_updated_at();

insert into app_meta.table_classification(table_name, classification, service_scope, keep_reason, notes)
values
('profiles', 'core', 'global', 'Main user profile', 'Unified user id core table'),
('driver_applications', 'core', 'driver', 'Driver application lifecycle', 'Keep as main driver application table'),
('driver_documents', 'core', 'driver', 'Driver document storage', 'Keep as main driver documents table'),
('driver_service_settings', 'core', 'driver', 'Driver enabled service flags', 'Boolean service settings are canonical'),
('vehicles', 'core', 'driver', 'Approved driver vehicles', 'Active vehicle and capacity source'),
('vehicle_change_requests', 'core', 'driver', 'Vehicle add/update approval flow', 'Admin approval queue'),
('driver_presence', 'core', 'driver', 'Online/offline presence', 'Current online presence source'),
('wallets', 'core', 'wallet', 'Main wallet balance', 'Keep as canonical wallet'),
('wallet_transactions', 'core', 'wallet', 'Wallet transaction history', 'Keep as canonical wallet history'),
('orders', 'core', 'orders', 'Future unified order base', 'Keep as universal order backbone'),
('notifications', 'core', 'global', 'Notifications', 'Keep'),
('push_tokens', 'core', 'global', 'Push delivery tokens', 'Keep'),
('regions', 'core', 'geo', 'Geography', 'Keep'),
('districts', 'core', 'geo', 'Geography', 'Keep'),

('city_taxi_orders', 'service_primary', 'city', 'Current city taxi order source', 'Current service-primary table'),
('delivery_orders', 'service_primary', 'delivery', 'Current delivery order source', 'Current service-primary table'),
('cargo_orders', 'service_primary', 'freight', 'Current cargo order source', 'Current service-primary table'),
('cargo_offers', 'service_primary', 'freight', 'Current cargo offer source', 'Used by freight bidding flow'),
('cargo_feed', 'service_primary', 'freight', 'Freight feed data', 'Keep during migration'),
('cargo_status_events', 'service_primary', 'freight', 'Cargo event history', 'Keep during migration'),
('cargo_tracking_points', 'service_primary', 'freight', 'Cargo tracking points', 'Keep during migration'),
('cargo_ratings', 'service_primary', 'freight', 'Cargo ratings', 'Keep during migration'),
('district_trips', 'service_primary', 'interdistrict', 'Current district trip source', 'Current service-primary table'),
('district_trip_requests', 'service_primary', 'interdistrict', 'Current district request source', 'Current service-primary table'),
('district_bookings', 'service_primary', 'interdistrict', 'District booking layer', 'Keep during migration'),
('district_routes', 'service_primary', 'interdistrict', 'District routes', 'Keep during migration'),
('district_pitaks', 'service_primary', 'interdistrict', 'District pitak data', 'Keep during migration'),
('interprov_trips', 'service_primary', 'intercity', 'Current interprovincial trip source', 'Preferred trip table'),
('interprov_bookings', 'service_primary', 'intercity', 'Current interprovincial booking source', 'Preferred booking table'),
('inter_prov_seat_requests', 'service_primary', 'intercity', 'Seat request source', 'Current seat request table'),
('intercity_bookings', 'service_primary', 'intercity', 'Intercity booking layer', 'Keep during migration'),
('intercity_routes', 'service_primary', 'intercity', 'Intercity routes', 'Keep during migration'),

('drivers', 'legacy', 'driver', 'Duplicate/old driver table', 'Do not drop yet; likely replaced by profiles + driver_applications'),
('driver_profiles', 'legacy', 'driver', 'Duplicate/old driver profile layer', 'Do not drop yet; audit frontend usage first'),
('inter_prov_trips', 'legacy', 'intercity', 'Duplicate trip table', 'Likely duplicate of interprov_trips'),
('transactions', 'legacy', 'wallet', 'Old transaction layer', 'Audit before cleanup'),
('billing_transactions', 'legacy', 'wallet', 'Old billing layer', 'Audit before cleanup')
on conflict (table_name) do update
set classification = excluded.classification,
    service_scope = excluded.service_scope,
    keep_reason = excluded.keep_reason,
    notes = excluded.notes;

comment on table public.profiles is 'CORE: main user profile table';
comment on table public.driver_applications is 'CORE: main driver application table';
comment on table public.driver_documents is 'CORE: main driver documents table';
comment on table public.driver_service_settings is 'CORE: canonical driver service flags table';
comment on table public.vehicles is 'CORE: canonical driver vehicles table';
comment on table public.vehicle_change_requests is 'CORE: vehicle approval/change queue';
comment on table public.driver_presence is 'CORE: canonical driver online presence';
comment on table public.wallets is 'CORE: canonical wallet table';
comment on table public.wallet_transactions is 'CORE: canonical wallet transaction history';
comment on table public.orders is 'CORE: future unified orders backbone';

comment on table public.city_taxi_orders is 'SERVICE_PRIMARY: city taxi current source table';
comment on table public.delivery_orders is 'SERVICE_PRIMARY: delivery current source table';
comment on table public.cargo_orders is 'SERVICE_PRIMARY: freight current source table';
comment on table public.cargo_offers is 'SERVICE_PRIMARY: freight offers current source table';
comment on table public.district_trips is 'SERVICE_PRIMARY: interdistrict current source table';
comment on table public.district_trip_requests is 'SERVICE_PRIMARY: interdistrict request source table';
comment on table public.interprov_trips is 'SERVICE_PRIMARY: intercity preferred trip source';
comment on table public.interprov_bookings is 'SERVICE_PRIMARY: intercity preferred booking source';
comment on table public.inter_prov_seat_requests is 'SERVICE_PRIMARY: intercity seat request source';
comment on table public.intercity_bookings is 'SERVICE_PRIMARY: intercity booking layer kept during migration';

comment on table public.drivers is 'LEGACY: duplicate/old driver table. Do not drop before audit';
comment on table public.driver_profiles is 'LEGACY: duplicate/old driver profile table. Do not drop before audit';
comment on table public.inter_prov_trips is 'LEGACY: likely duplicate of interprov_trips. Audit before cleanup';
comment on table public.transactions is 'LEGACY: old transaction table. Audit before cleanup';
comment on table public.billing_transactions is 'LEGACY: old billing transaction table. Audit before cleanup';

create or replace view app_meta.v_table_classification as
select
  tc.table_name,
  tc.classification,
  tc.service_scope,
  tc.keep_reason,
  tc.notes,
  t.table_type
from app_meta.table_classification tc
left join information_schema.tables t
  on t.table_schema = 'public'
 and t.table_name = tc.table_name
order by
  case tc.classification
    when 'core' then 1
    when 'service_primary' then 2
    when 'legacy' then 3
    when 'drop_later' then 4
    else 5
  end,
  tc.table_name;
