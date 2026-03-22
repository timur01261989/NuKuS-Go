-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id),
  order_id     UUID,
  category     TEXT NOT NULL,
  priority     TEXT DEFAULT 'medium',
  subject      TEXT NOT NULL,
  description  TEXT,
  status       TEXT DEFAULT 'open',
  assigned_to  UUID,
  resolution   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_tickets_user    ON support_tickets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_status  ON support_tickets(status, priority);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id   TEXT,
  sender_role TEXT DEFAULT 'user',
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ticket_msgs ON ticket_messages(ticket_id, created_at);

-- Fleet vehicles
CREATE TABLE IF NOT EXISTS fleet_vehicles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id      UUID REFERENCES profiles(id),
  brand          TEXT NOT NULL,
  model          TEXT NOT NULL,
  year           INTEGER,
  plate_number   TEXT UNIQUE NOT NULL,
  color          TEXT,
  body_type      TEXT DEFAULT 'sedan',
  fuel_type      TEXT DEFAULT 'petrol',
  seat_count     INTEGER DEFAULT 4,
  is_active      BOOLEAN DEFAULT TRUE,
  is_verified    BOOLEAN DEFAULT FALSE,
  mileage_km     INTEGER DEFAULT 0,
  insurance_exp  DATE,
  tech_check_exp DATE,
  photos         TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fleet_driver ON fleet_vehicles(driver_id, is_active);

-- Ratings
CREATE TABLE IF NOT EXISTS ratings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID,
  from_id      UUID,
  to_id        UUID,
  from_role    TEXT,
  stars        SMALLINT CHECK (stars BETWEEN 1 AND 5),
  categories   JSONB DEFAULT '{}',
  comment      TEXT,
  tags         TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_anonymous BOOLEAN DEFAULT FALSE,
  is_visible   BOOLEAN DEFAULT TRUE,
  disputed     BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ratings_to_id ON ratings(to_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ratings_order_from ON ratings(order_id, from_id);

CREATE TABLE IF NOT EXISTS rating_disputes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id   UUID REFERENCES ratings(id),
  disputer_id UUID,
  reason      TEXT,
  status      TEXT DEFAULT 'pending',
  decision    TEXT,
  resolved_by UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type         TEXT NOT NULL,
  period_start TIMESTAMPTZ,
  period_end   TIMESTAMPTZ,
  status       TEXT DEFAULT 'ready',
  data         JSONB DEFAULT '{}',
  summary      TEXT,
  created_by   UUID,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  ready_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type, created_at DESC);

-- Platform config
CREATE TABLE IF NOT EXISTS platform_config (
  key          TEXT PRIMARY KEY,
  value        TEXT NOT NULL,
  type         TEXT DEFAULT 'string',
  description  TEXT,
  environment  TEXT DEFAULT 'all',
  is_secret    BOOLEAN DEFAULT FALSE,
  version      INTEGER DEFAULT 1,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_by   UUID
);
