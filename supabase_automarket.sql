-- =============================================================================
-- supabase_automarket.sql
-- Nukus Go — Auto Market kengaytirilgan jadvallar
-- supabase_gamification.sql dan KEYIN bajaring
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. vikup_listings — Vikup/Arenda (Rent-to-Own) e'lonlari
--    Asosiy e'lon (car_listings) ga bog'langan qo'shimcha jadval
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vikup_listings (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id            TEXT        NOT NULL,               -- marketApi'dagi e'lon id
  seller_user_id   UUID,
  car_price        NUMERIC     NOT NULL DEFAULT 0,     -- mashinaning to'liq narxi (USD)
  initial_payment  NUMERIC     NOT NULL DEFAULT 2000,  -- boshlang'ich to'lov (USD)
  monthly_payment  NUMERIC     NOT NULL DEFAULT 300,   -- oylik to'lov (USD)
  duration_months  INTEGER     NOT NULL DEFAULT 12,    -- muddat (oy)
  total_overpay    NUMERIC     GENERATED ALWAYS AS (
    initial_payment + monthly_payment * duration_months
  ) STORED,                                            -- umumiy to'lanadigan summa
  interest_rate    NUMERIC     NOT NULL DEFAULT 0,     -- foiz stavkasi (% yillik, 0=foizsiz)
  down_payment_pct NUMERIC     NOT NULL DEFAULT 20,    -- boshlang'ich to'lov foizi
  conditions       TEXT,                               -- qo'shimcha shartlar
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vikup_ad ON vikup_listings (ad_id);
CREATE INDEX IF NOT EXISTS idx_vikup_seller ON vikup_listings (seller_user_id);

ALTER TABLE vikup_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vikup_read" ON vikup_listings;
CREATE POLICY "vikup_read" ON vikup_listings FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "vikup_own" ON vikup_listings;
CREATE POLICY "vikup_own" ON vikup_listings FOR ALL
  USING (auth.uid() = seller_user_id)
  WITH CHECK (auth.uid() = seller_user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. barter_offers — Barter (mashina almashtirish) takliflari
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS barter_offers (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id            TEXT        NOT NULL,               -- sotuvdagi mashina e'loni
  offerer_user_id  UUID,
  offer_brand      TEXT        NOT NULL,               -- taklif qilinayotgan mashina brendi
  offer_model      TEXT        NOT NULL,               -- taklif qilinayotgan mashina modeli
  offer_year       INTEGER,
  offer_mileage    INTEGER,
  offer_price      NUMERIC,                            -- taklif qilinayotgan mashina narxi
  extra_payment    NUMERIC     NOT NULL DEFAULT 0,     -- ustiga to'lanadigan pul (USD)
  description      TEXT,
  status           TEXT        NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','accepted','rejected','expired')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_barter_ad ON barter_offers (ad_id);
CREATE INDEX IF NOT EXISTS idx_barter_offerer ON barter_offers (offerer_user_id);

ALTER TABLE barter_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "barter_read" ON barter_offers;
CREATE POLICY "barter_read" ON barter_offers FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "barter_own" ON barter_offers;
CREATE POLICY "barter_own" ON barter_offers FOR INSERT
  WITH CHECK (auth.uid() = offerer_user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. zapchast_ads — Ehtiyot qismlar e'lonlari
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS zapchast_ads (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_user_id   UUID,
  title            TEXT        NOT NULL,
  description      TEXT,
  category         TEXT        NOT NULL DEFAULT 'other',  -- 'dvigatel','transmissiya','podveska','kuzov','elektrika','rezina','disk','other'
  compatible_brand TEXT,                                  -- mos keladigan marka
  compatible_model TEXT,                                  -- mos keladigan model
  compatible_years TEXT,                                  -- masalan "2010-2020"
  price            NUMERIC     NOT NULL DEFAULT 0,
  currency         TEXT        NOT NULL DEFAULT 'UZS',
  condition        TEXT        NOT NULL DEFAULT 'used'    -- 'new','used','damaged'
                   CHECK (condition IN ('new','used','damaged')),
  city             TEXT,
  images           TEXT[]      DEFAULT '{}',
  phone            TEXT,
  is_razborka      BOOLEAN     NOT NULL DEFAULT FALSE,    -- razborka bo'limiga tegishli
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  views            INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zapchast_brand_model ON zapchast_ads (compatible_brand, compatible_model);
CREATE INDEX IF NOT EXISTS idx_zapchast_category ON zapchast_ads (category);
CREATE INDEX IF NOT EXISTS idx_zapchast_razborka ON zapchast_ads (is_razborka);

ALTER TABLE zapchast_ads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "zapchast_read" ON zapchast_ads;
CREATE POLICY "zapchast_read" ON zapchast_ads FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "zapchast_own" ON zapchast_ads;
CREATE POLICY "zapchast_own" ON zapchast_ads FOR ALL
  USING (auth.uid() = seller_user_id)
  WITH CHECK (auth.uid() = seller_user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. auto_battles — Avto-battle e'lonlari
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auto_battles (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,                   -- "Gentra 2023 vs Monza 2023"
  car_a_id     TEXT        NOT NULL,                   -- birinchi mashina e'lon id
  car_a_label  TEXT        NOT NULL,                   -- "Gentra 2023"
  car_b_id     TEXT        NOT NULL,                   -- ikkinchi mashina e'lon id
  car_b_label  TEXT        NOT NULL,                   -- "Monza 2023"
  votes_a      INTEGER     NOT NULL DEFAULT 0,
  votes_b      INTEGER     NOT NULL DEFAULT 0,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  ends_at      TIMESTAMPTZ,                            -- tugash vaqti (NULL=abadiy)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS battle_votes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id  UUID        NOT NULL REFERENCES auto_battles(id) ON DELETE CASCADE,
  user_id    UUID,
  ip_hash    TEXT,                                     -- tizimga kirmaganlarga IP hash
  choice     TEXT        NOT NULL CHECK (choice IN ('a','b')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_battle_vote_user
  ON battle_votes (battle_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_battle_vote_ip
  ON battle_votes (battle_id, ip_hash) WHERE ip_hash IS NOT NULL AND user_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_battle_active ON auto_battles (is_active, ends_at);

ALTER TABLE auto_battles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "battles_read" ON auto_battles;
CREATE POLICY "battles_read" ON auto_battles FOR SELECT USING (TRUE);

ALTER TABLE battle_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "votes_read" ON battle_votes;
CREATE POLICY "votes_read" ON battle_votes FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "votes_insert" ON battle_votes;
CREATE POLICY "votes_insert" ON battle_votes FOR INSERT WITH CHECK (TRUE);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. service_books — "Rasxod Daftar" — mashina xizmat tarixi
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_books (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL,
  car_brand        TEXT        NOT NULL,
  car_model        TEXT        NOT NULL,
  car_year         INTEGER,
  car_plate        TEXT,                              -- davlat raqami (ixtiyoriy)
  current_mileage  INTEGER     NOT NULL DEFAULT 0,
  oil_change_km    INTEGER     NOT NULL DEFAULT 10000, -- moy almashtirish intervalı (km)
  last_oil_change  INTEGER     NOT NULL DEFAULT 0,     -- oxirgi moy almashtirish probegi
  insurance_expiry DATE,                               -- sug'urta tugash sanasi
  tex_expiry       DATE,                               -- texosmotr tugash sanasi
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_records (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id      UUID        NOT NULL REFERENCES service_books(id) ON DELETE CASCADE,
  service_type TEXT        NOT NULL,                  -- 'oil_change','tire','insurance','tex','repair','other'
  title        TEXT        NOT NULL,
  mileage_at   INTEGER,
  cost         NUMERIC,
  currency     TEXT        DEFAULT 'UZS',
  next_due_km  INTEGER,                               -- keyingi xizmat km'da
  next_due_date DATE,                                 -- yoki sanada
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_book_user ON service_books (user_id);
CREATE INDEX IF NOT EXISTS idx_service_records_book ON service_records (book_id);

ALTER TABLE service_books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_book_own" ON service_books;
CREATE POLICY "service_book_own" ON service_books FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE service_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_rec_own" ON service_records;
CREATE POLICY "service_rec_own" ON service_records FOR ALL
  USING (EXISTS (SELECT 1 FROM service_books WHERE id = service_records.book_id AND user_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. garaj_items — "Mening Garajim" — xohlangan mashinalar
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS garaj_items (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL,
  ad_id         TEXT        NOT NULL,                 -- e'lon id
  brand         TEXT,
  model         TEXT,
  year          INTEGER,
  price_at_add  NUMERIC,                              -- qo'shilgan paytdagi narx
  current_price NUMERIC,                              -- hozirgi narx (pollling orqali yangilanadi)
  currency      TEXT        DEFAULT 'UZS',
  image_url     TEXT,
  note          TEXT,
  notify_price_drop BOOLEAN NOT NULL DEFAULT TRUE,    -- narx tushganda xabar berish
  added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_garaj_unique ON garaj_items (user_id, ad_id);
CREATE INDEX IF NOT EXISTS idx_garaj_user ON garaj_items (user_id);

ALTER TABLE garaj_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "garaj_own" ON garaj_items;
CREATE POLICY "garaj_own" ON garaj_items FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. price_analytics — Bozor narx tarixiy ma'lumotlari (model bo'yicha)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS price_analytics (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  brand        TEXT        NOT NULL,
  model        TEXT        NOT NULL,
  year         INTEGER,
  avg_price    NUMERIC     NOT NULL,
  min_price    NUMERIC,
  max_price    NUMERIC,
  sample_count INTEGER     NOT NULL DEFAULT 0,
  currency     TEXT        NOT NULL DEFAULT 'USD',
  recorded_at  DATE        NOT NULL DEFAULT CURRENT_DATE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_price_analytics_unique
  ON price_analytics (brand, model, year, recorded_at);
CREATE INDEX IF NOT EXISTS idx_price_analytics_model ON price_analytics (brand, model, recorded_at DESC);

ALTER TABLE price_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "analytics_read" ON price_analytics;
CREATE POLICY "analytics_read" ON price_analytics FOR SELECT USING (TRUE);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Realtime
-- ─────────────────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE auto_battles;
ALTER PUBLICATION supabase_realtime ADD TABLE battle_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE garaj_items;

-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  RAISE NOTICE '✅ supabase_automarket.sql muvaffaqiyatli bajarildi';
END $$;
