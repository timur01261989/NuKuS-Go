create table if not exists settlement_batches (
  id uuid primary key default gen_random_uuid(),
  batch_type text not null,
  status text default 'pending',
  total_amount numeric default 0,
  created_at timestamptz default now()
);

create table if not exists settlement_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references settlement_batches(id) on delete cascade,
  recipient_type text not null,
  recipient_id uuid,
  amount numeric default 0,
  status text default 'pending',
  created_at timestamptz default now()
);
