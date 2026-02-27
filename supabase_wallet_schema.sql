-- NUKUS GO: Wallet Schema
-- Bu fayl to'rtinchi bajarilishi kerak

-- ============================================================
-- WALLETS (foydalanuvchi hisobvaraqlari)
-- ============================================================

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  balance_uzs numeric not null default 0,
  total_topup_uzs numeric not null default 0,
  total_spent_uzs numeric not null default 0,
  frozen_uzs numeric not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_wallets_user on public.wallets(user_id);
create index if not exists idx_wallets_balance on public.wallets(balance_uzs);

alter table public.wallets enable row level security;

drop policy if exists "wallets_select_own" on public.wallets;
create policy "wallets_select_own" on public.wallets
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "wallets_update_own" on public.wallets;
create policy "wallets_update_own" on public.wallets
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ============================================================
-- WALLET TRANSACTIONS (hisob kuzatmasi)
-- ============================================================

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_uzs numeric not null,
  kind text not null check (kind in ('topup','spend','cashback','bonus','refund')),
  description text,
  order_id uuid references public.orders(id) on delete set null,
  reference_id text,
  meta jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_wallet_tx_user on public.wallet_transactions(user_id);
create index if not exists idx_wallet_tx_kind on public.wallet_transactions(kind);
create index if not exists idx_wallet_tx_created on public.wallet_transactions(created_at desc);
create index if not exists idx_wallet_tx_order on public.wallet_transactions(order_id);

alter table public.wallet_transactions enable row level security;

drop policy if exists "wallet_tx_select_own" on public.wallet_transactions;
create policy "wallet_tx_select_own" on public.wallet_transactions
for select to authenticated
using (user_id = auth.uid());

-- ============================================================
-- PROMO CODES (promokodlar)
-- ============================================================

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('fixed','percent')),
  discount_value numeric not null,
  max_uses integer,
  used_count integer default 0,
  min_order_value numeric,
  max_discount_uzs numeric,
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  is_active boolean default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_promo_codes_active on public.promo_codes(is_active);
create index if not exists idx_promo_codes_code on public.promo_codes(code);

-- ============================================================
-- PROMO CODE USAGE (promokod foydalanish tarixi)
-- ============================================================

create table if not exists public.promo_code_usage (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid not null references public.promo_codes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  discount_uzs numeric not null,
  used_at timestamptz default now()
);

create index if not exists idx_promo_usage_user on public.promo_code_usage(user_id);
create index if not exists idx_promo_usage_code on public.promo_code_usage(promo_code_id);
create index if not exists idx_promo_usage_order on public.promo_code_usage(order_id);

-- ============================================================
-- CASHBACK (kash-bek tashlamalar)
-- ============================================================

create table if not exists public.cashback_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  cashback_uzs numeric not null,
  cashback_rate numeric not null,
  status text not null check (status in ('pending','credited','declined')) default 'pending',
  created_at timestamptz default now(),
  credited_at timestamptz
);

create index if not exists idx_cashback_user on public.cashback_records(user_id);
create index if not exists idx_cashback_order on public.cashback_records(order_id);
create index if not exists idx_cashback_status on public.cashback_records(status);

-- ============================================================
-- ATOMIC TRANSFER FUNCTION (xavfsiz pul o'tkazish)
-- ============================================================

create or replace function public.transfer_wallet_funds(
  p_from_user_id uuid,
  p_to_user_id uuid,
  p_amount_uzs numeric,
  p_description text default 'Transfer'
)
returns jsonb
language plpgsql
as $$
declare
  v_from_balance numeric;
  v_result jsonb;
begin
  -- Get and lock sender's wallet
  select balance_uzs into v_from_balance
  from public.wallets
  where user_id = p_from_user_id
  for update;

  if v_from_balance is null then
    return jsonb_build_object('ok', false, 'error', 'Sender wallet topilmadi');
  end if;

  if v_from_balance < p_amount_uzs then
    return jsonb_build_object('ok', false, 'error', 'Yetarli mablag'' yo''q');
  end if;

  -- Deduct from sender
  update public.wallets
  set balance_uzs = balance_uzs - p_amount_uzs,
      total_spent_uzs = total_spent_uzs + p_amount_uzs,
      updated_at = now()
  where user_id = p_from_user_id;

  -- Add to receiver
  insert into public.wallets (user_id, balance_uzs, total_topup_uzs, updated_at)
  values (p_to_user_id, p_amount_uzs, p_amount_uzs, now())
  on conflict (user_id) do update
  set balance_uzs = wallets.balance_uzs + p_amount_uzs,
      updated_at = now();

  -- Record transaction for sender
  insert into public.wallet_transactions (user_id, amount_uzs, kind, description)
  values (p_from_user_id, -p_amount_uzs, 'spend', p_description);

  -- Record transaction for receiver
  insert into public.wallet_transactions (user_id, amount_uzs, kind, description)
  values (p_to_user_id, p_amount_uzs, 'topup', p_description);

  return jsonb_build_object('ok', true, 'message', 'Transfer muvaffaqiyatli');
end;
$$;

-- ============================================================
-- GRANTS
-- ============================================================

grant select, insert, update, delete on public.wallets to authenticated;
grant select, insert, update on public.wallet_transactions to authenticated;
grant select on public.promo_codes to authenticated;
grant select, insert on public.promo_code_usage to authenticated;
grant select on public.cashback_records to authenticated;
grant select, insert, update on public.cashback_records to authenticated;

grant select on all tables in schema public to anon;
grant usage, select, update on all sequences in schema public to authenticated;
