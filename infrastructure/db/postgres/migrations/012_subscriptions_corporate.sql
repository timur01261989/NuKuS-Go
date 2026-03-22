-- Subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES profiles(id) UNIQUE,
  plan_id          TEXT NOT NULL,
  billing_cycle    TEXT DEFAULT 'monthly',
  status           TEXT DEFAULT 'active',
  starts_at        TIMESTAMPTZ DEFAULT NOW(),
  expires_at       TIMESTAMPTZ,
  auto_renew       BOOLEAN DEFAULT TRUE,
  payment_method_id TEXT,
  family_member_ids UUID[] DEFAULT ARRAY[]::UUID[],
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subs_user_id  ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_expires  ON user_subscriptions(expires_at);

-- Corporate
CREATE TABLE IF NOT EXISTS corporate_companies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  bin             TEXT UNIQUE,
  wallet_balance  BIGINT DEFAULT 0,
  credit_limit    BIGINT DEFAULT 0,
  spending_policy JSONB DEFAULT '{}',
  invoice_cycle   TEXT DEFAULT 'monthly',
  status          TEXT DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS corporate_employees (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID REFERENCES corporate_companies(id),
  user_id          UUID REFERENCES profiles(id),
  full_name        TEXT,
  email            TEXT,
  department       TEXT,
  monthly_budget_uzs BIGINT DEFAULT 500000,
  spent_this_month   BIGINT DEFAULT 0,
  active           BOOLEAN DEFAULT TRUE,
  added_at         TIMESTAMPTZ DEFAULT NOW()
);
