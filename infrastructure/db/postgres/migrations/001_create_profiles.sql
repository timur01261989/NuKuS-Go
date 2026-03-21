-- Migration 001: Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone       VARCHAR(20) UNIQUE NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  role        VARCHAR(20) DEFAULT 'client',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
