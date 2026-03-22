-- Safety
CREATE TABLE IF NOT EXISTS trusted_contacts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  phone          TEXT NOT NULL,
  relation       TEXT,
  notify_on_sos  BOOLEAN DEFAULT TRUE,
  notify_on_trip BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS driver_checkins (
  order_id   UUID,
  driver_id  UUID,
  lat        DECIMAL(10,8),
  lng        DECIMAL(11,8),
  speed_kmh  DECIMAL(6,2),
  ts         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_checkins_order_id ON driver_checkins(order_id, ts DESC);

-- Privacy
CREATE TABLE IF NOT EXISTS data_export_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id),
  status      TEXT DEFAULT 'pending',
  export_data TEXT,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deletion_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES profiles(id),
  reason         TEXT,
  status         TEXT DEFAULT 'pending',
  scheduled_for  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS privacy_settings (
  user_id             UUID PRIMARY KEY REFERENCES profiles(id),
  analytics_enabled   BOOLEAN DEFAULT TRUE,
  marketing_enabled   BOOLEAN DEFAULT TRUE,
  share_location      BOOLEAN DEFAULT TRUE,
  data_retention_days INTEGER DEFAULT 365,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
