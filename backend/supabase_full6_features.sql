-- Nukus Go: Full 6 features (add-only) - Wallet/Promo/Notifications/Heatmap/Traffic/Driver Stats
-- Safe to run multiple times.

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null default 'system',
  title text,
  body text,
  data jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on notifications(user_id, created_at desc);

create table if not exists wallets (
  user_id uuid primary key references users(id) on delete cascade,
  balance_uzs bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount_uzs bigint not null,
  kind text not null,
  ref_order_id uuid references orders(id) on delete set null,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_wallet_tx_user on wallet_transactions(user_id, created_at desc);

create table if not exists promo_codes (
  code text primary key,
  kind text not null default 'percent',
  value numeric not null,
  max_uses int,
  used_count int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  min_order_uzs bigint,
  is_active boolean not null default true,
  meta jsonb
);

create table if not exists promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null references promo_codes(code) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  discount_uzs bigint not null,
  created_at timestamptz not null default now(),
  unique(code, user_id, order_id)
);
create index if not exists idx_promo_redemptions_user on promo_redemptions(user_id, created_at desc);

alter table if exists orders
  add column if not exists promo_code text,
  add column if not exists promo_discount_uzs bigint,
  add column if not exists cashback_uzs bigint,
  add column if not exists paid_with_wallet boolean default false,
  add column if not exists final_price_uzs bigint,
  add column if not exists completed_at timestamptz;

create table if not exists traffic_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  center_lat double precision not null,
  center_lng double precision not null,
  radius_km double precision not null default 2,
  multiplier double precision not null default 1.0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_traffic_active on traffic_zones(is_active);

create table if not exists driver_stats (
  driver_user_id uuid primary key references users(id) on delete cascade,
  rating_avg double precision default 5.0,
  completed_count int not null default 0,
  cancel_count int not null default 0,
  acceptance_rate double precision default 1.0,
  updated_at timestamptz not null default now()
);

create table if not exists demand_buckets (
  id uuid primary key default gen_random_uuid(),
  cell_id text not null,
  region text default 'UZ',
  window_start timestamptz not null,
  window_end timestamptz not null,
  demand_count int not null default 0,
  created_at timestamptz not null default now(),
  unique(cell_id, window_start, window_end)
);
create index if not exists idx_demand_window on demand_buckets(window_end desc);

alter table notifications enable row level security;
alter table wallets enable row level security;
alter table wallet_transactions enable row level security;
alter table promo_codes enable row level security;
alter table promo_redemptions enable row level security;
alter table demand_buckets enable row level security;
alter table traffic_zones enable row level security;
alter table driver_stats enable row level security;

drop policy if exists notif_select_own on notifications;
create policy notif_select_own on notifications for select using (user_id = auth.uid());
drop policy if exists notif_update_own on notifications;
create policy notif_update_own on notifications for update using (user_id = auth.uid());

drop policy if exists wallets_select_own on wallets;
create policy wallets_select_own on wallets for select using (user_id = auth.uid());
drop policy if exists wtx_select_own on wallet_transactions;
create policy wtx_select_own on wallet_transactions for select using (user_id = auth.uid());

drop policy if exists promo_select_public on promo_codes;
create policy promo_select_public on promo_codes for select using (is_active = true);

drop policy if exists promo_red_select_own on promo_redemptions;
create policy promo_red_select_own on promo_redemptions for select using (user_id = auth.uid());

drop policy if exists demand_select_public on demand_buckets;
create policy demand_select_public on demand_buckets for select using (true);

drop policy if exists tz_select_public on traffic_zones;
create policy tz_select_public on traffic_zones for select using (is_active = true);

drop policy if exists dstats_select_public on driver_stats;
create policy dstats_select_public on driver_stats for select using (true);
