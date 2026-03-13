create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  partner_type text not null,
  company_name text not null,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists partner_api_keys (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references partners(id) on delete cascade,
  api_key text not null,
  status text default 'active',
  created_at timestamptz default now(),
  unique(api_key)
);

create table if not exists partner_webhooks (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references partners(id) on delete cascade,
  webhook_url text not null,
  event_type text not null,
  created_at timestamptz default now()
);
