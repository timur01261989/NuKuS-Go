-- Migration 003: Delivery orders
CREATE TABLE IF NOT EXISTS delivery_orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES profiles(id),
  driver_id        UUID,
  parcel_type      VARCHAR(30) DEFAULT 'package',
  weight_kg        DECIMAL(6,2),
  pickup_lat       DECIMAL(10,8),
  pickup_lng       DECIMAL(11,8),
  pickup_address   TEXT,
  pickup_contact_name  TEXT,
  pickup_contact_phone TEXT,
  dropoff_lat      DECIMAL(10,8),
  dropoff_lng      DECIMAL(11,8),
  dropoff_address  TEXT,
  dropoff_contact_name  TEXT,
  dropoff_contact_phone TEXT,
  status           VARCHAR(30) DEFAULT 'searching',
  price_uzs        BIGINT DEFAULT 0,
  who_pays         VARCHAR(20) DEFAULT 'sender',
  door_to_door     BOOLEAN DEFAULT TRUE,
  comment          TEXT,
  pin_code         VARCHAR(4),
  cancel_reason    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_delivery_user_id ON delivery_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status  ON delivery_orders(status);
