-- payments_ledger: double-entry ledger (minimal)
create table if not exists payments_ledger_accounts (
  id bigserial primary key,
  owner_type text not null, -- 'user'|'system'
  owner_id uuid,
  currency text not null default 'UZS',
  name text not null, -- 'user_wallet'|'platform_revenue'|'driver_earnings' etc.
  created_at timestamptz not null default now(),
  unique(owner_type, owner_id, currency, name)
);

create table if not exists payments_ledger_entries (
  id bigserial primary key,
  tx_id uuid not null,
  account_id bigint not null references payments_ledger_accounts(id) on delete cascade,
  amount numeric not null, -- positive=credit, negative=debit
  memo text,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payments_ledger_entries_tx_idx on payments_ledger_entries(tx_id);
create index if not exists payments_ledger_entries_account_idx on payments_ledger_entries(account_id, created_at desc);

-- Ensure sum(entries.amount) = 0 per tx_id at application level.