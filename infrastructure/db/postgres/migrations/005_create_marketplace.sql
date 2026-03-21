-- Migration 005: Auto marketplace
CREATE TABLE IF NOT EXISTS car_ads (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id    UUID REFERENCES profiles(id),
  brand        TEXT NOT NULL,
  model        TEXT NOT NULL,
  year         INTEGER NOT NULL,
  mileage_km   INTEGER DEFAULT 0,
  price_usd    INTEGER NOT NULL,
  price_uzs    BIGINT,
  fuel_type    VARCHAR(20) DEFAULT 'petrol',
  transmission VARCHAR(20) DEFAULT 'manual',
  body_type    VARCHAR(30) DEFAULT 'sedan',
  color        TEXT,
  engine_cc    INTEGER,
  description  TEXT,
  photos       TEXT[],
  city         TEXT DEFAULT 'Toshkent',
  phone        VARCHAR(20) NOT NULL,
  status       VARCHAR(20) DEFAULT 'active',
  views        INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ads_brand    ON car_ads(brand);
CREATE INDEX IF NOT EXISTS idx_ads_status   ON car_ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_city     ON car_ads(city);
CREATE INDEX IF NOT EXISTS idx_ads_price    ON car_ads(price_usd);
CREATE INDEX IF NOT EXISTS idx_ads_created  ON car_ads(created_at DESC);
