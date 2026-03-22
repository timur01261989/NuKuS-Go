-- Wallet system
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id),
  type          TEXT NOT NULL,
  amount_uzs    BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  description   TEXT,
  order_id      UUID,
  reference     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_id ON wallet_transactions(user_id, created_at DESC);

-- Alter wallets table
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS locked_uzs BIGINT DEFAULT 0;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS total_earned BIGINT DEFAULT 0;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS total_spent  BIGINT DEFAULT 0;
