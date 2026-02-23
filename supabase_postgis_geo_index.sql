-- ============================================================
-- NUKUS GO — PostGIS Geo Index (500+ haydovchi uchun)
-- ============================================================
-- Bu faylni faqat haydovchilar soni 500+ bo'lganda ishga tushiring.
-- Supabase'da postgis extension bepul mavjud.
--
-- Bu migration:
--   - driver_presence jadvaliga geography column qo'shadi
--   - Trigger orqali lat/lng o'zgarganda avtomatik yangilanadi
--   - GIST index bilan DB'da geo filter — JS'da filter shart emas
--   - drivers_within_radius() RPC funksiyasi — dispatch ishlatadi
-- ============================================================

-- Extension yoqish (Supabase'da allaqachon yoqilgan bo'lishi mumkin)
CREATE EXTENSION IF NOT EXISTS postgis;

-- driver_presence jadvaliga geography column qo'shish
ALTER TABLE driver_presence
  ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

-- Mavjud qatorlarni yangilash
UPDATE driver_presence
  SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  WHERE lat IS NOT NULL AND lng IS NOT NULL AND location IS NULL;

-- Trigger: lat/lng o'zgarganda location'ni avtomatik yangilash
CREATE OR REPLACE FUNCTION sync_driver_presence_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_driver_presence_location ON driver_presence;
CREATE TRIGGER trg_sync_driver_presence_location
  BEFORE INSERT OR UPDATE OF lat, lng ON driver_presence
  FOR EACH ROW EXECUTE FUNCTION sync_driver_presence_location();

-- GIST geo index — ST_DWithin uchun zarur
CREATE INDEX IF NOT EXISTS idx_driver_presence_geo
  ON driver_presence USING GIST(location)
  WHERE is_online = true;

-- -------------------------------------------------------
-- RPC funksiyasi: dispatch.js bu funksiyani chaqiradi
-- (hozircha dispatch.js JS'da haversine ishlatadi,
--  lekin 500+ haydovchida shu RPC ga o'tish kerak)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION drivers_within_radius(
  pickup_lat   DOUBLE PRECISION,
  pickup_lng   DOUBLE PRECISION,
  radius_km    DOUBLE PRECISION DEFAULT 5,
  since_ts     TIMESTAMPTZ DEFAULT (NOW() - INTERVAL '2 minutes')
)
RETURNS TABLE (
  driver_user_id  UUID,
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  is_online       BOOLEAN,
  updated_at      TIMESTAMPTZ,
  dist_km         DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    dp.driver_user_id,
    dp.lat,
    dp.lng,
    dp.is_online,
    dp.updated_at,
    ST_Distance(
      dp.location,
      ST_SetSRID(ST_MakePoint(pickup_lng, pickup_lat), 4326)::geography
    ) / 1000.0 AS dist_km
  FROM driver_presence dp
  WHERE
    dp.is_online = true
    AND dp.updated_at >= since_ts
    AND dp.location IS NOT NULL
    AND ST_DWithin(
      dp.location,
      ST_SetSRID(ST_MakePoint(pickup_lng, pickup_lat), 4326)::geography,
      radius_km * 1000
    )
  ORDER BY dist_km ASC
  LIMIT 100;
$$;
