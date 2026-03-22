-- A/B Testing
CREATE TABLE IF NOT EXISTS experiments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  variants    JSONB NOT NULL DEFAULT '[]',
  targeting   JSONB NOT NULL DEFAULT '{}',
  status      TEXT DEFAULT 'draft',
  started_at  TIMESTAMPTZ,
  ended_at    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS experiment_assignments (
  experiment_id  UUID REFERENCES experiments(id),
  user_id        UUID REFERENCES profiles(id),
  variant_id     TEXT NOT NULL,
  variant_config JSONB,
  assigned_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(experiment_id, user_id)
);

CREATE TABLE IF NOT EXISTS experiment_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES experiments(id),
  user_id       UUID,
  event         TEXT,
  value         FLOAT DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exp_events ON experiment_events(experiment_id, event);
