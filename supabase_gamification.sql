-- =============================================================================
-- supabase_gamification.sql
-- Nukus Go — Gamifikatsiya + AI Dinamik Narxlash (Admin boshqaradi)
-- supabase_new_tables.sql dan KEYIN bajaring
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. driver_levels — Haydovchi darajalari (admin belgilaydi)
--    Bronza / Kumush / Oltin va boshqa maxsus darajalar
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS driver_levels (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT        NOT NULL UNIQUE,          -- 'Bronza', 'Kumush', 'Oltin', 'Platina'
  min_trips          INTEGER     NOT NULL DEFAULT 0,        -- shu darajaga kirish uchun minimum safarlar
  min_rating         NUMERIC     NOT NULL DEFAULT 0,        -- minimum reyting
  commission_rate    NUMERIC     NOT NULL DEFAULT 0.15,     -- komissiya ulushi (0.15 = 15%)
  priority_dispatch  BOOLEAN     NOT NULL DEFAULT FALSE,    -- buyurtmalarni oldinroq ko'rish
  badge_color        TEXT        NOT NULL DEFAULT '#CD7F32',-- bronza rang
  badge_emoji        TEXT        NOT NULL DEFAULT '🥉',
  bonus_multiplier   NUMERIC     NOT NULL DEFAULT 1.0,      -- bonus ball multiplikatori
  sort_order         INTEGER     NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Standart darajalar (admin o'zgartira oladi)
INSERT INTO driver_levels (name, min_trips, min_rating, commission_rate, priority_dispatch, badge_color, badge_emoji, bonus_multiplier, sort_order)
VALUES
  ('Yangi',   0,   0.0, 0.18, FALSE, '#94a3b8', '🆕', 1.0, 0),
  ('Bronza',  30,  4.0, 0.15, FALSE, '#CD7F32', '🥉', 1.1, 1),
  ('Kumush',  100, 4.3, 0.13, FALSE, '#C0C0C0', '🥈', 1.2, 2),
  ('Oltin',   300, 4.6, 0.10, TRUE,  '#FFD700', '🥇', 1.5, 3),
  ('Platina', 700, 4.8, 0.08, TRUE,  '#E5E4E2', '💎', 2.0, 4)
ON CONFLICT (name) DO NOTHING;

-- RLS
ALTER TABLE driver_levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "driver_levels_read" ON driver_levels;
CREATE POLICY "driver_levels_read" ON driver_levels FOR SELECT USING (true);
DROP POLICY IF EXISTS "driver_levels_admin" ON driver_levels;
CREATE POLICY "driver_levels_admin" ON driver_levels FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. driver_gamification — Haydovchining joriy holati
--    (daraja, jami safarlar, joriy missiya progressi)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS driver_gamification (
  driver_user_id     UUID        PRIMARY KEY,
  level_name         TEXT        NOT NULL DEFAULT 'Yangi',
  total_trips        INTEGER     NOT NULL DEFAULT 0,
  total_earnings_uzs BIGINT      NOT NULL DEFAULT 0,
  bonus_points       INTEGER     NOT NULL DEFAULT 0,         -- yig'ilgan bonus balllar
  streak_days        INTEGER     NOT NULL DEFAULT 0,         -- ketma-ket ishlagan kunlar
  last_trip_date     DATE,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drv_gamif_level ON driver_gamification (level_name);

ALTER TABLE driver_gamification ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "drv_gamif_own" ON driver_gamification;
CREATE POLICY "drv_gamif_own" ON driver_gamification FOR ALL
  USING (auth.uid() = driver_user_id)
  WITH CHECK (auth.uid() = driver_user_id);
DROP POLICY IF EXISTS "drv_gamif_admin" ON driver_gamification;
CREATE POLICY "drv_gamif_admin" ON driver_gamification FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. daily_missions — Kunlik missiyalar (admin yaratadi)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_missions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,                        -- 'Bugun 10 ta buyurtma bajar'
  description   TEXT,
  target_type   TEXT        NOT NULL DEFAULT 'trips'         -- 'trips', 'earnings', 'streak', 'rating'
                            CHECK (target_type IN ('trips','earnings','streak','rating')),
  target_value  NUMERIC     NOT NULL DEFAULT 10,             -- maqsad qiymati
  bonus_uzs     INTEGER     NOT NULL DEFAULT 0,              -- pul bonus
  bonus_points  INTEGER     NOT NULL DEFAULT 0,              -- ball bonus
  level_name    TEXT,                                        -- NULL = barchaga, yoki 'Bronza' kabi
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  valid_from    DATE        NOT NULL DEFAULT CURRENT_DATE,
  valid_to      DATE,                                        -- NULL = abadiy
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Standart missiyalar
INSERT INTO daily_missions (title, description, target_type, target_value, bonus_uzs, bonus_points, is_active)
VALUES
  ('Yangi haydovchi bonusi',  '10 ta buyurtmani muvaffaqiyatli bajaring', 'trips',    10,  50000, 100, TRUE),
  ('Faol kun',                'Bugun 5 ta buyurtma bajaring',             'trips',    5,   25000,  50, TRUE),
  ('Zo''r xizmat',            'Bugun 6+ yulduz reyting saqlang',          'rating',   4.7, 30000,  75, TRUE),
  ('Ketma-ket 3 kun',         '3 kun ketma-ket ishlang',                 'streak',   3,   75000, 150, TRUE),
  ('Daromad maqsadi',         'Bugun 200,000 so''m ishlang',             'earnings', 200000, 40000, 80, TRUE)
ON CONFLICT DO NOTHING;

ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "missions_read" ON daily_missions;
CREATE POLICY "missions_read" ON daily_missions FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "missions_admin" ON daily_missions;
CREATE POLICY "missions_admin" ON daily_missions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. mission_progress — Haydovchi missiya taraqqiyoti (bugungi)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mission_progress (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_user_id UUID        NOT NULL,
  mission_id     UUID        NOT NULL REFERENCES daily_missions(id) ON DELETE CASCADE,
  current_value  NUMERIC     NOT NULL DEFAULT 0,
  completed      BOOLEAN     NOT NULL DEFAULT FALSE,
  completed_at   TIMESTAMPTZ,
  rewarded       BOOLEAN     NOT NULL DEFAULT FALSE,         -- bonus berilganmi
  date           DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mission_prog_unique
  ON mission_progress (driver_user_id, mission_id, date);
CREATE INDEX IF NOT EXISTS idx_mission_prog_driver_date
  ON mission_progress (driver_user_id, date);

ALTER TABLE mission_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mission_prog_own" ON mission_progress;
CREATE POLICY "mission_prog_own" ON mission_progress FOR ALL
  USING (auth.uid() = driver_user_id)
  WITH CHECK (auth.uid() = driver_user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. client_bonuses — Mijoz cashback / bonus ball holati
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_bonuses (
  user_id         UUID        PRIMARY KEY,
  points          INTEGER     NOT NULL DEFAULT 0,            -- joriy bonus balllar
  total_earned    INTEGER     NOT NULL DEFAULT 0,            -- jami yig'ilgan
  total_spent     INTEGER     NOT NULL DEFAULT 0,            -- jami sarflangan
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE client_bonuses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_bonus_own" ON client_bonuses;
CREATE POLICY "client_bonus_own" ON client_bonuses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. bonus_transactions — Har bir ball yig'ish/sarflash tarixi
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bonus_transactions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL,
  kind        TEXT        NOT NULL DEFAULT 'earn'
              CHECK (kind IN ('earn','spend','expire','mission_reward','admin_adjust')),
  points      INTEGER     NOT NULL,                          -- musbat = yig'ish, manfiy = sarflash
  uzs_value   INTEGER     NOT NULL DEFAULT 0,               -- so'mda ekvivalent
  order_id    UUID,
  mission_id  UUID,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bonus_tx_user ON bonus_transactions (user_id, created_at DESC);

ALTER TABLE bonus_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bonus_tx_own" ON bonus_transactions;
CREATE POLICY "bonus_tx_own" ON bonus_transactions FOR SELECT USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. surge_config — AI Dinamik Narxlash sozlamalari (ADMIN boshqaradi)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS surge_config (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL UNIQUE,              -- 'Tun tarifi', 'Yomg'ir tarifi', 'Ish soati'
  rule_type        TEXT        NOT NULL DEFAULT 'time'
                   CHECK (rule_type IN ('time','weather','demand','manual')),
  multiplier       NUMERIC     NOT NULL DEFAULT 1.0 CHECK (multiplier >= 1.0 AND multiplier <= 5.0),
  min_multiplier   NUMERIC     NOT NULL DEFAULT 1.0,
  max_multiplier   NUMERIC     NOT NULL DEFAULT 3.0,
  -- Vaqt qoidasi uchun
  time_from        TEXT,                                     -- 'HH:MM'
  time_to          TEXT,                                     -- 'HH:MM'
  days_of_week     INTEGER[],                                -- [1,2,3,4,5] = Du-Ju; NULL = har kuni
  -- Ob-havo qoidasi uchun
  weather_codes    INTEGER[],                                -- OpenWeatherMap condition codes
  weather_label    TEXT,                                     -- 'Yomg'ir', 'Qor' va boshq.
  -- Talab qoidasi uchun
  min_demand_ratio NUMERIC,                                  -- (so'rovlar / haydovchilar) nisbati
  -- Umumiy
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  applies_to       TEXT        NOT NULL DEFAULT 'all'        -- 'all', 'standard', 'comfort', 'truck'
                   CHECK (applies_to IN ('all','standard','comfort','truck')),
  priority         INTEGER     NOT NULL DEFAULT 0,           -- yuqori = ustuvor
  description      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Standart surge qoidalar
INSERT INTO surge_config (name, rule_type, multiplier, min_multiplier, max_multiplier, time_from, time_to, is_active, applies_to, priority, description)
VALUES
  ('Tun tarifi',    'time', 1.2, 1.2, 1.5, '22:00', '06:00', TRUE, 'all',      5,  'Kechqurun 22:00 dan ertalab 06:00 gacha'),
  ('Ertalab rush',  'time', 1.3, 1.2, 1.5, '07:00', '09:00', TRUE, 'all',      4,  'Ish boshlanish vaqti'),
  ('Kechki rush',   'time', 1.3, 1.2, 1.5, '17:00', '19:30', TRUE, 'all',      4,  'Ish tugash vaqti'),
  ('Yomg''ir',      'weather', 1.4, 1.2, 2.0, NULL, NULL, TRUE, 'all',         8,  'Yomg''ir yog''ayotganda narx ko''tariladi'),
  ('Qor',           'weather', 1.5, 1.3, 2.5, NULL, NULL, TRUE, 'all',         9,  'Qor yog''ayotganda'),
  ('Yuqori talab',  'demand',  1.5, 1.2, 3.0, NULL, NULL, TRUE, 'all',         10, 'Haydovchilar kam, so''rovlar ko''p')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE surge_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "surge_read_active" ON surge_config;
CREATE POLICY "surge_read_active" ON surge_config FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "surge_admin" ON surge_config;
CREATE POLICY "surge_admin" ON surge_config FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Trigger: Buyurtma COMPLETE bo'lganda gamification yangilanadi
--    - haydovchi: total_trips++, daraja tekshirish, mission progress++
--    - mijoz: cashback ball berish
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION on_order_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_driver_id     UUID;
  v_client_id     UUID;
  v_price         NUMERIC;
  v_cashback_pts  INTEGER;
  v_cashback_rate NUMERIC := 0.01;  -- 1% cashback
  v_new_trips     INTEGER;
  v_best_level    TEXT;
  v_today         DATE := CURRENT_DATE;
  v_mission       RECORD;
  v_prog          RECORD;
BEGIN
  -- Faqat status 'completed' ga o'zgarganda ishlaydi
  IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  v_driver_id := NEW.driver_user_id;
  v_client_id := NEW.user_id;
  v_price     := COALESCE(NEW.price, NEW.amount, NEW."priceUzs", 0)::NUMERIC;

  -- ── HAYDOVCHI GAMIFICATION ──────────────────────────────────────────
  IF v_driver_id IS NOT NULL THEN
    -- driver_gamification yangilash / yaratish
    INSERT INTO driver_gamification (driver_user_id, total_trips, total_earnings_uzs, last_trip_date, updated_at)
    VALUES (v_driver_id, 1, v_price::BIGINT, v_today, NOW())
    ON CONFLICT (driver_user_id) DO UPDATE
      SET total_trips        = driver_gamification.total_trips + 1,
          total_earnings_uzs = driver_gamification.total_earnings_uzs + v_price::BIGINT,
          last_trip_date     = v_today,
          streak_days        = CASE
            WHEN driver_gamification.last_trip_date = v_today - INTERVAL '1 day'
            THEN driver_gamification.streak_days + 1
            WHEN driver_gamification.last_trip_date = v_today
            THEN driver_gamification.streak_days
            ELSE 1
          END,
          updated_at         = NOW();

    -- Yangilangan jami safarlarni olish
    SELECT total_trips INTO v_new_trips
    FROM driver_gamification WHERE driver_user_id = v_driver_id;

    -- Eng yaxshi darajani aniqlash
    SELECT name INTO v_best_level
    FROM driver_levels
    WHERE min_trips <= v_new_trips
    ORDER BY min_trips DESC
    LIMIT 1;

    IF v_best_level IS NOT NULL THEN
      UPDATE driver_gamification
      SET level_name = v_best_level
      WHERE driver_user_id = v_driver_id;
    END IF;

    -- Mission progress yangilash (faqat bugungi aktiv missiyalar)
    FOR v_mission IN
      SELECT dm.id, dm.target_type, dm.target_value, dm.bonus_uzs, dm.bonus_points
      FROM daily_missions dm
      WHERE dm.is_active = TRUE
        AND (dm.valid_from IS NULL OR dm.valid_from <= v_today)
        AND (dm.valid_to   IS NULL OR dm.valid_to   >= v_today)
        AND (dm.level_name IS NULL OR dm.level_name = (
              SELECT level_name FROM driver_gamification WHERE driver_user_id = v_driver_id
            ))
    LOOP
      -- Upsert mission_progress
      INSERT INTO mission_progress (driver_user_id, mission_id, current_value, date)
      VALUES (v_driver_id, v_mission.id, 0, v_today)
      ON CONFLICT (driver_user_id, mission_id, date) DO NOTHING;

      -- Progress qo'shish
      IF v_mission.target_type = 'trips' THEN
        UPDATE mission_progress
        SET current_value = current_value + 1
        WHERE driver_user_id = v_driver_id AND mission_id = v_mission.id AND date = v_today;
      ELSIF v_mission.target_type = 'earnings' THEN
        UPDATE mission_progress
        SET current_value = current_value + v_price
        WHERE driver_user_id = v_driver_id AND mission_id = v_mission.id AND date = v_today;
      END IF;

      -- Missiya tugadi va hali mukofot berilmagan?
      SELECT * INTO v_prog
      FROM mission_progress
      WHERE driver_user_id = v_driver_id AND mission_id = v_mission.id AND date = v_today;

      IF v_prog.current_value >= v_mission.target_value AND NOT v_prog.completed THEN
        UPDATE mission_progress
        SET completed = TRUE, completed_at = NOW(), rewarded = TRUE
        WHERE driver_user_id = v_driver_id AND mission_id = v_mission.id AND date = v_today;

        -- Haydovchi walletiga bonus uzs qo'shish
        IF v_mission.bonus_uzs > 0 THEN
          INSERT INTO wallets (user_id, balance_uzs, updated_at)
          VALUES (v_driver_id, v_mission.bonus_uzs, NOW())
          ON CONFLICT (user_id) DO UPDATE
            SET balance_uzs = wallets.balance_uzs + v_mission.bonus_uzs, updated_at = NOW();

          INSERT INTO wallet_transactions (user_id, amount_uzs, kind, meta)
          VALUES (v_driver_id, v_mission.bonus_uzs, 'mission_reward',
                  jsonb_build_object('mission_id', v_mission.id, 'mission_title',
                    (SELECT title FROM daily_missions WHERE id = v_mission.id)));
        END IF;

        -- Bonus ball qo'shish
        IF v_mission.bonus_points > 0 THEN
          INSERT INTO driver_gamification (driver_user_id, bonus_points)
          VALUES (v_driver_id, v_mission.bonus_points)
          ON CONFLICT (driver_user_id) DO UPDATE
            SET bonus_points = driver_gamification.bonus_points + v_mission.bonus_points;
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- ── MIJOZ CASHBACK ──────────────────────────────────────────────────
  IF v_client_id IS NOT NULL AND v_price > 0 THEN
    v_cashback_pts := GREATEST(1, FLOOR(v_price * v_cashback_rate))::INTEGER;

    INSERT INTO client_bonuses (user_id, points, total_earned, updated_at)
    VALUES (v_client_id, v_cashback_pts, v_cashback_pts, NOW())
    ON CONFLICT (user_id) DO UPDATE
      SET points       = client_bonuses.points + v_cashback_pts,
          total_earned = client_bonuses.total_earned + v_cashback_pts,
          updated_at   = NOW();

    INSERT INTO bonus_transactions (user_id, kind, points, uzs_value, order_id, note)
    VALUES (v_client_id, 'earn', v_cashback_pts, v_price::INTEGER, NEW.id,
            'Safar uchun cashback: ' || v_price::INTEGER || ' so''m');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_order_completed_gamification ON orders;
CREATE TRIGGER trg_order_completed_gamification
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status <> 'completed')
  EXECUTE FUNCTION on_order_completed();

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Realtime
-- ─────────────────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE driver_gamification;
ALTER PUBLICATION supabase_realtime ADD TABLE mission_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE client_bonuses;
ALTER PUBLICATION supabase_realtime ADD TABLE surge_config;

-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  RAISE NOTICE '✅ supabase_gamification.sql muvaffaqiyatli bajarildi';
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. tariff_config — Tarif sozlamalari (Admin boshqaradi, api/pricing.js o'qiydi)
--     tariffs.json eski bo'lib qolsa ham fallback sifatida ishlayveradi
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tariff_config (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT        NOT NULL UNIQUE
               CHECK (service_type IN ('standard','comfort','truck')),
  base         NUMERIC     NOT NULL DEFAULT 5000,   -- boshlang'ich narx (so'm)
  per_km       NUMERIC     NOT NULL DEFAULT 1200,   -- km uchun narx
  per_min      NUMERIC     NOT NULL DEFAULT 200,    -- daqiqa uchun narx
  min_fare     NUMERIC     NOT NULL DEFAULT 8000,   -- minimal narx
  currency     TEXT        NOT NULL DEFAULT 'UZS',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Standart tariflar
INSERT INTO tariff_config (service_type, base, per_km, per_min, min_fare)
VALUES
  ('standard', 5000,  1200, 200, 8000),
  ('comfort',  8000,  1600, 250, 12000),
  ('truck',    15000, 2500, 300, 20000)
ON CONFLICT (service_type) DO NOTHING;

-- RLS
ALTER TABLE tariff_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tariff_read" ON tariff_config;
CREATE POLICY "tariff_read" ON tariff_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "tariff_admin" ON tariff_config;
CREATE POLICY "tariff_admin" ON tariff_config FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tariff_config;
