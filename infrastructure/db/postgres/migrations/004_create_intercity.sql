-- Migration 004: Intercity trips & bookings
CREATE TABLE IF NOT EXISTS intercity_trips (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id            UUID REFERENCES profiles(id),
  from_city            TEXT NOT NULL,
  to_city              TEXT NOT NULL,
  departure_time       TIMESTAMPTZ NOT NULL,
  seats_total          INTEGER DEFAULT 4,
  seats_available      INTEGER DEFAULT 4,
  price_per_seat_uzs   BIGINT NOT NULL,
  status               VARCHAR(20) DEFAULT 'open',
  amenities            TEXT[],
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intercity_bookings (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id          UUID REFERENCES intercity_trips(id),
  user_id          UUID REFERENCES profiles(id),
  seats            INTEGER NOT NULL,
  total_price_uzs  BIGINT NOT NULL,
  status           VARCHAR(20) DEFAULT 'confirmed',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
