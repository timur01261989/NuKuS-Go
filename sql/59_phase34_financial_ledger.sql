create table if not exists ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  account_key text not null unique,
  account_type text not null,
  created_at timestamptz default now()
);

create table if not exists ledger_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid default gen_random_uuid(),
  account_id uuid references ledger_accounts(id) on delete cascade,
  entry_type text not null,
  amount numeric not null,
  reference_type text,
  reference_id uuid,
  created_at timestamptz default now()
);

create index if not exists idx_ledger_entries_transaction
on ledger_entries(transaction_id, created_at);
