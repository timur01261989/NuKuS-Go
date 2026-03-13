create table if not exists fleet_owners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  company_name text,
  created_at timestamptz default now()
);

create table if not exists fleet_drivers (
  id uuid primary key default gen_random_uuid(),
  fleet_owner_id uuid references fleet_owners(id) on delete cascade,
  driver_id uuid not null,
  status text default 'active',
  created_at timestamptz default now(),
  unique(fleet_owner_id, driver_id)
);

create table if not exists fleet_commissions (
  id uuid primary key default gen_random_uuid(),
  fleet_owner_id uuid references fleet_owners(id) on delete cascade,
  service_type text not null default 'taxi',
  commission_rate numeric default 0.10,
  created_at timestamptz default now()
);

create table if not exists fleet_wallets (
  id uuid primary key default gen_random_uuid(),
  fleet_owner_id uuid references fleet_owners(id) on delete cascade,
  balance numeric default 0,
  updated_at timestamptz default now(),
  unique(fleet_owner_id)
);
