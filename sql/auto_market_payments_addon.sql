-- UniGo: AUTO MARKET payments + paid actions addon
-- Run AFTER:
--  1) supabase_wallet_schema.sql (wallets + wallet_transactions)
--  2) auto_market_schema.sql (auto_ads, images, favorites, ...)

-- ============================================================
-- PAYMENTS (topup intents)
-- ============================================================
create table if not exists public.auto_payments (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  amount_uzs int not null,
  status text not null default 'pending' check (status in ('pending','paid','failed','canceled')),
  meta jsonb,
  created_at timestamptz default now(),
  paid_at timestamptz
);

create index if not exists idx_auto_payments_user on public.auto_payments(user_id);
create index if not exists idx_auto_payments_status on public.auto_payments(status);

alter table public.auto_payments enable row level security;

-- User can read own payments
drop policy if exists "auto_payments_select_own" on public.auto_payments;
create policy "auto_payments_select_own" on public.auto_payments
for select to authenticated
using (user_id = auth.uid());

-- No direct insert/update from client (payments are created server-side)

-- ============================================================
-- PROMOTIONS (VIP/TOP/RAISE)
-- ============================================================
create table if not exists public.auto_promotions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ad_id uuid not null references public.auto_ads(id) on delete cascade,
  promo_type text not null check (promo_type in ('top_1day','top_3day','vip_7day','raise')),
  price_uzs int not null,
  started_at timestamptz default now(),
  expires_at timestamptz,
  status text not null default 'active' check (status in ('active','expired','canceled')),
  created_at timestamptz default now()
);

create index if not exists idx_auto_promos_ad on public.auto_promotions(ad_id);
create index if not exists idx_auto_promos_status on public.auto_promotions(status);

alter table public.auto_promotions enable row level security;

-- Owner can read own promotions
drop policy if exists "auto_promotions_select_own" on public.auto_promotions;
create policy "auto_promotions_select_own" on public.auto_promotions
for select to authenticated
using (user_id = auth.uid());

-- No direct insert/update from client (server-only)

-- ============================================================
-- CONTACT REVEALS (paid phone reveal)
-- ============================================================
create table if not exists public.auto_contact_reveals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ad_id uuid not null references public.auto_ads(id) on delete cascade,
  price_uzs int not null,
  created_at timestamptz default now(),
  unique(user_id, ad_id)
);

create index if not exists idx_auto_reveals_user on public.auto_contact_reveals(user_id);
create index if not exists idx_auto_reveals_ad on public.auto_contact_reveals(ad_id);

alter table public.auto_contact_reveals enable row level security;

drop policy if exists "auto_contact_reveals_select_own" on public.auto_contact_reveals;
create policy "auto_contact_reveals_select_own" on public.auto_contact_reveals
for select to authenticated
using (user_id = auth.uid());

-- No direct insert from client (server-only)
