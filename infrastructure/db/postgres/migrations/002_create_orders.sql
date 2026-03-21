-- Migration 002: Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID REFERENCES profiles(id),
  driver_id       UUID,
  service_type    VARCHAR(30) NOT NULL,
  status          VARCHAR(30) DEFAULT 'searching',
  pickup_lat      DECIMAL(10,8),
  pickup_lng      DECIMAL(11,8),
  pickup_address  TEXT,
  dropoff_lat     DECIMAL(10,8),
  dropoff_lng     DECIMAL(11,8),
  dropoff_address TEXT,
  price_uzs       BIGINT DEFAULT 0,
  payment_method  VARCHAR(30) DEFAULT 'cash',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_client_id  ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_service    ON orders(service_type);
CREATE INDEX IF NOT EXISTS idx_orders_created    ON orders(created_at DESC);
