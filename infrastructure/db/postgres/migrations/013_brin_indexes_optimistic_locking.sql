-- ============================================================
-- BRIN Indexes — 100x smaller than B-Tree for time-series data
-- Use for append-only tables (orders, events, locations history)
-- ============================================================

-- Orders — time-based BRIN (orders are created sequentially)
CREATE INDEX IF NOT EXISTS idx_orders_created_brin
  ON orders USING BRIN (created_at) WITH (pages_per_range = 32);

-- Event store — BRIN for version + time
CREATE INDEX IF NOT EXISTS idx_event_store_occurred_brin
  ON event_store USING BRIN (occurred_at) WITH (pages_per_range = 64);

-- Driver location history (ClickHouse is better, but BRIN for PG fallback)
CREATE TABLE IF NOT EXISTS driver_location_history (
  driver_id    UUID         NOT NULL,
  lat          DECIMAL(10,8),
  lng          DECIMAL(11,8),
  speed_kmh    DECIMAL(6,2),
  bearing      DECIMAL(5,2),
  h3_cell_9    TEXT,           -- H3 Resolution 9
  h3_cell_7    TEXT,           -- H3 Resolution 7 (district)
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (recorded_at);

-- Monthly partitions
CREATE TABLE IF NOT EXISTS driver_location_history_2026_01
  PARTITION OF driver_location_history
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE IF NOT EXISTS driver_location_history_2026_02
  PARTITION OF driver_location_history
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE IF NOT EXISTS driver_location_history_2026_03
  PARTITION OF driver_location_history
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- BRIN on each partition
CREATE INDEX IF NOT EXISTS idx_dlh_2026_01_brin
  ON driver_location_history_2026_01 USING BRIN (recorded_at);
CREATE INDEX IF NOT EXISTS idx_dlh_2026_02_brin
  ON driver_location_history_2026_02 USING BRIN (recorded_at);

-- ============================================================
-- OPTIMISTIC LOCKING — version column (prevents deadlocks)
-- ============================================================

-- Add version column to critical tables
ALTER TABLE orders        ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE wallets        ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 0;

-- Optimistic update function
CREATE OR REPLACE FUNCTION update_with_version(
  p_table   TEXT,
  p_id      UUID,
  p_version INTEGER,
  p_data    JSONB
) RETURNS BOOLEAN
LANGUAGE plpgsql AS $$
DECLARE
  rows_updated INTEGER;
  set_clause   TEXT;
BEGIN
  -- Build SET clause from JSON
  SELECT string_agg(key || ' = ' || quote_literal(value), ', ')
  INTO set_clause
  FROM jsonb_each_text(p_data);

  EXECUTE format(
    'UPDATE %I SET %s, version = version + 1 WHERE id = $1 AND version = $2',
    p_table, set_clause
  ) USING p_id, p_version;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$;

-- ============================================================
-- REGIONAL PARTITIONING — Hot-Warm-Cold data tiering
-- ============================================================

-- Orders partitioned by region (hash sharding by city prefix)
CREATE TABLE IF NOT EXISTS orders_partitioned (
  LIKE orders INCLUDING ALL
) PARTITION BY HASH (client_id);

CREATE TABLE IF NOT EXISTS orders_shard_0 PARTITION OF orders_partitioned FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE IF NOT EXISTS orders_shard_1 PARTITION OF orders_partitioned FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE IF NOT EXISTS orders_shard_2 PARTITION OF orders_partitioned FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE IF NOT EXISTS orders_shard_3 PARTITION OF orders_partitioned FOR VALUES WITH (MODULUS 4, REMAINDER 3);

-- Indexes on each shard
CREATE INDEX IF NOT EXISTS idx_orders_s0_client ON orders_shard_0 (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_s1_client ON orders_shard_1 (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_s2_client ON orders_shard_2 (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_s3_client ON orders_shard_3 (client_id, created_at DESC);

-- ============================================================
-- INDEX ONLY SCANS — Only select indexed columns
-- ============================================================

-- Covering index for order status checks (most common query)
CREATE INDEX IF NOT EXISTS idx_orders_status_covering
  ON orders (status, client_id, created_at DESC)
  INCLUDE (price_uzs, service_type, driver_id);

-- Covering index for driver presence
CREATE INDEX IF NOT EXISTS idx_driver_presence_covering
  ON driver_presence (is_online, active_service_type)
  INCLUDE (driver_id, lat, lng, last_seen_at);

-- ============================================================
-- SDUI components table
-- ============================================================
CREATE TABLE IF NOT EXISTS sdui_components (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_id   TEXT NOT NULL,
  type        TEXT NOT NULL,
  visible     BOOLEAN DEFAULT TRUE,
  priority    INTEGER DEFAULT 50,
  targeting   JSONB DEFAULT '{}',
  layout      JSONB DEFAULT '{}',
  data        JSONB DEFAULT '{}',
  actions     JSONB DEFAULT '[]',
  active      BOOLEAN DEFAULT TRUE,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sdui_screen_active ON sdui_components (screen_id, active, priority DESC);
