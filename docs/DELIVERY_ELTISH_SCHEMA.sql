create table if not exists delivery_orders (
  id text primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid null,
  service_mode text not null,
  status text not null default 'searching',
  parcel_type text not null,
  parcel_label text not null,
  weight_kg numeric default 0,
  price integer not null default 0,
  commission_amount integer not null default 0,
  payment_method text not null default 'cash',
  comment text null,
  receiver_name text not null,
  receiver_phone text not null,
  sender_phone text not null,
  pickup_mode text not null,
  dropoff_mode text not null,
  pickup_region text,
  pickup_district text,
  pickup_label text,
  pickup_lat numeric,
  pickup_lng numeric,
  dropoff_region text,
  dropoff_district text,
  dropoff_label text,
  dropoff_lat numeric,
  dropoff_lng numeric,
  matched_trip_id uuid null,
  matched_trip_title text,
  matched_driver_id uuid null,
  matched_driver_name text,
  history jsonb default '[]'::jsonb
);

create index if not exists idx_delivery_orders_status on delivery_orders(status);
create index if not exists idx_delivery_orders_service_mode on delivery_orders(service_mode);
create index if not exists idx_delivery_orders_matched_trip on delivery_orders(matched_trip_id);
