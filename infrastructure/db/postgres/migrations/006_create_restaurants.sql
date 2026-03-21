-- Migration 006: Food & restaurants
CREATE TABLE IF NOT EXISTS restaurants (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  logo_url            TEXT,
  category            TEXT DEFAULT 'fast-food',
  rating              DECIMAL(3,2) DEFAULT 4.0,
  delivery_time_min   INTEGER DEFAULT 30,
  min_order_uzs       BIGINT DEFAULT 15000,
  is_open             BOOLEAN DEFAULT TRUE,
  city                TEXT DEFAULT 'Toshkent',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id   UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  price_uzs       BIGINT NOT NULL,
  image_url       TEXT,
  category        TEXT,
  is_available    BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS food_orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES profiles(id),
  restaurant_id    UUID REFERENCES restaurants(id),
  courier_id       UUID,
  items            JSONB NOT NULL,
  status           VARCHAR(30) DEFAULT 'pending',
  delivery_lat     DECIMAL(10,8),
  delivery_lng     DECIMAL(11,8),
  delivery_address TEXT,
  subtotal_uzs     BIGINT DEFAULT 0,
  delivery_fee_uzs BIGINT DEFAULT 5000,
  total_uzs        BIGINT DEFAULT 0,
  comment          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
