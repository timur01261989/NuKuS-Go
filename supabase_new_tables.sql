-- =============================================================================
-- supabase_new_tables.sql
-- Nukus Go — Yangi jadvallar va Trigger'lar
-- Supabase SQL Editor'da bir marta ishga tushiring
-- supabase_performance_indexes.sql dan KEYIN bajaring
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. order_ratings — Mijoz haydovchini baholaydi
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_ratings (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID        NOT NULL,
  from_user_id   UUID,                          -- kim baholadi
  to_user_id     UUID,                          -- kim baholandi
  role           TEXT        NOT NULL DEFAULT 'client_rates_driver'
                             CHECK (role IN ('client_rates_driver', 'driver_rates_client')),
  stars          INTEGER     NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bir buyurtma uchun bir rol faqat bir baho
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_ratings_unique
  ON order_ratings (order_id, role);

CREATE INDEX IF NOT EXISTS idx_order_ratings_to_user
  ON order_ratings (to_user_id);

-- RLS
ALTER TABLE order_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_ratings_insert_own" ON order_ratings;
CREATE POLICY "order_ratings_insert_own"
  ON order_ratings FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

DROP POLICY IF EXISTS "order_ratings_select_own" ON order_ratings;
CREATE POLICY "order_ratings_select_own"
  ON order_ratings FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Trigger: haydovchi reytingini avtomatik yangilash
--    order_ratings'ga yangi baho qo'shilganda driver_stats.rating_avg o'zgaradi
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_driver_rating_avg()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE driver_stats
  SET
    rating_avg    = (
      SELECT ROUND(AVG(stars)::NUMERIC, 2)
      FROM order_ratings
      WHERE to_user_id = NEW.to_user_id
        AND role = 'client_rates_driver'
    ),
    ratings_count = (
      SELECT COUNT(*)
      FROM order_ratings
      WHERE to_user_id = NEW.to_user_id
        AND role = 'client_rates_driver'
    ),
    updated_at    = NOW()
  WHERE driver_user_id = NEW.to_user_id;

  -- Agar driver_stats qatori yo'q bo'lsa — yangi qator qo'shamiz
  IF NOT FOUND THEN
    INSERT INTO driver_stats (driver_user_id, rating_avg, ratings_count, updated_at)
    VALUES (
      NEW.to_user_id,
      (SELECT ROUND(AVG(stars)::NUMERIC, 2) FROM order_ratings
         WHERE to_user_id = NEW.to_user_id AND role = 'client_rates_driver'),
      (SELECT COUNT(*) FROM order_ratings
         WHERE to_user_id = NEW.to_user_id AND role = 'client_rates_driver'),
      NOW()
    )
    ON CONFLICT (driver_user_id) DO UPDATE
      SET rating_avg    = EXCLUDED.rating_avg,
          ratings_count = EXCLUDED.ratings_count,
          updated_at    = EXCLUDED.updated_at;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_driver_rating ON order_ratings;
CREATE TRIGGER trg_update_driver_rating
  AFTER INSERT ON order_ratings
  FOR EACH ROW
  WHEN (NEW.role = 'client_rates_driver')
  EXECUTE FUNCTION update_driver_rating_avg();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. push_subscriptions — Web Push subscription'larni saqlash
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL,
  endpoint   TEXT        NOT NULL,
  p256dh     TEXT        NOT NULL,
  auth       TEXT        NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subs_user_endpoint
  ON push_subscriptions (user_id, endpoint);

CREATE INDEX IF NOT EXISTS idx_push_subs_user
  ON push_subscriptions (user_id);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subs_own" ON push_subscriptions;
CREATE POLICY "push_subs_own"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. notifications — Yuborilgan notificationlar log
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL,
  title      TEXT,
  body       TEXT,
  action_url TEXT,
  is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON notifications (user_id, is_read, created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_own" ON notifications;
CREATE POLICY "notifications_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. promo_codes — Admin yaratiladigan promo kodlar
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_codes (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT        NOT NULL UNIQUE,
  discount_type  TEXT        NOT NULL DEFAULT 'percent'
                             CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC     NOT NULL CHECK (discount_value > 0),
  max_uses       INTEGER,                        -- NULL = cheksiz
  used_count     INTEGER     NOT NULL DEFAULT 0,
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code_active
  ON promo_codes (code, is_active);

-- RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promo_read_active" ON promo_codes;
CREATE POLICY "promo_read_active"
  ON promo_codes FOR SELECT
  USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

DROP POLICY IF EXISTS "promo_admin_all" ON promo_codes;
CREATE POLICY "promo_admin_all"
  ON promo_codes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. promo_uses — Promo koddan foydalanish tarixi
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_uses (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id     UUID        NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL,
  order_id     UUID,
  discount_uzs NUMERIC,
  used_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1 user 1 promo bir marta ishlatishi mumkin
CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_uses_unique
  ON promo_uses (promo_id, user_id);

-- Promo ishlatilganda used_count ni oshiruvchi trigger
CREATE OR REPLACE FUNCTION increment_promo_used_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE promo_codes SET used_count = used_count + 1 WHERE id = NEW.promo_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_promo_used ON promo_uses;
CREATE TRIGGER trg_promo_used
  AFTER INSERT ON promo_uses
  FOR EACH ROW
  EXECUTE FUNCTION increment_promo_used_count();

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. sos_tickets — SOS xabarlar (driver yoki client yuboradi)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sos_tickets (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID,
  user_id     UUID,
  message     TEXT,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  resolved    BOOLEAN     NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_tickets_resolved
  ON sos_tickets (resolved, created_at DESC);

-- RLS
ALTER TABLE sos_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sos_insert_own" ON sos_tickets;
CREATE POLICY "sos_insert_own"
  ON sos_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "sos_admin_all" ON sos_tickets;
CREATE POLICY "sos_admin_all"
  ON sos_tickets FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Mavjud jadvallarni kengaytirish (agar ustun yo'q bo'lsa)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE profiles    ADD COLUMN IF NOT EXISTS blocked        BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE driver_stats ADD COLUMN IF NOT EXISTS ratings_count INTEGER NOT NULL DEFAULT 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Realtime — yangi jadvallar uchun yoqish
-- ─────────────────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE order_ratings;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE sos_tickets;

-- ─────────────────────────────────────────────────────────────────────────────
-- Tugadi
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  RAISE NOTICE '✅ supabase_new_tables.sql muvaffaqiyatli bajarildi';
END $$;
