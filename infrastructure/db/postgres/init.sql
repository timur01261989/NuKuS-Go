-- UniGo Platform Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users / Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone       VARCHAR(20) UNIQUE NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  role        VARCHAR(20) DEFAULT 'client' CHECK (role IN ('client', 'driver', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- OTP Codes
CREATE TABLE IF NOT EXISTS otp_codes (
  phone       VARCHAR(20) PRIMARY KEY,
  code        VARCHAR(6) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh Tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Drivers
CREATE TABLE IF NOT EXISTS drivers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID UNIQUE REFERENCES profiles(id),
  status      VARCHAR(20) DEFAULT 'offline',
  rating      DECIMAL(3,2) DEFAULT 5.00,
  total_rides INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id    UUID REFERENCES drivers(id) ON DELETE CASCADE,
  brand        TEXT NOT NULL,
  model        TEXT NOT NULL,
  year         INTEGER,
  plate_number VARCHAR(20) UNIQUE NOT NULL,
  color        TEXT,
  type         VARCHAR(30) DEFAULT 'sedan',
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID REFERENCES profiles(id),
  driver_id       UUID REFERENCES drivers(id),
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status    ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created   ON orders(created_at DESC);
