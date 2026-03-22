-- Event Store (Event Sourcing)
CREATE TABLE IF NOT EXISTS event_store (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id    TEXT NOT NULL,
  stream_type  TEXT NOT NULL,
  event_type   TEXT NOT NULL,
  version      INTEGER NOT NULL,
  payload      JSONB NOT NULL DEFAULT '{}',
  metadata     JSONB NOT NULL DEFAULT '{}',
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(stream_id, version)
);
CREATE INDEX IF NOT EXISTS idx_event_store_stream_id   ON event_store(stream_id);
CREATE INDEX IF NOT EXISTS idx_event_store_event_type  ON event_store(event_type);
CREATE INDEX IF NOT EXISTS idx_event_store_occurred_at ON event_store(occurred_at DESC);
