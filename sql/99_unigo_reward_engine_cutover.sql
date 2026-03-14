-- UniGo Reward Engine hardening cutover
-- Canonical reward/referral/promo stack only.
-- This migration is intentionally additive + destructive for deprecated bonus tables.

begin;

set search_path = public;

-- 1) Remove deprecated bonus tables completely.
drop table if exists public.client_bonuses cascade;
drop table if exists public.bonus_transactions cascade;
drop table if exists public.driver_bonus cascade;
drop table if exists public.driver_bonus_ledger cascade;

-- 2) Canonical wallet tx kinds.
alter table if exists public.wallet_transactions
  drop constraint if exists wallet_transactions_kind_check;
alter table if exists public.wallet_transactions
  add constraint wallet_transactions_kind_check
  check (
    kind in (
      'topup',
      'withdraw',
      'order_payment',
      'order_payout',
      'commission',
      'refund',
      'ad_fee',
      'manual_adjustment',
      'spend',
      'bonus',
      'referral_bonus',
      'promo_bonus',
      'mission_bonus',
      'loyalty_bonus'
    )
  );

create index if not exists idx_wallet_transactions_user_kind_created
  on public.wallet_transactions(user_id, kind, created_at desc);
create index if not exists idx_wallet_transactions_order_kind
  on public.wallet_transactions(order_id, kind)
  where order_id is not null;
create unique index if not exists uq_wallet_transactions_reward_key
  on public.wallet_transactions ((coalesce(metadata ->> 'reward_key', meta ->> 'reward_key')))
  where coalesce(metadata ->> 'reward_key', meta ->> 'reward_key') is not null;
create unique index if not exists uq_wallet_transactions_order_settlement
  on public.wallet_transactions(user_id, order_id, kind, direction)
  where order_id is not null and kind in ('order_payment', 'order_payout');
create index if not exists idx_reward_locks_reward_type_created
  on public.reward_locks(reward_type, created_at desc);
create index if not exists idx_bonus_campaigns_active_priority
  on public.bonus_campaigns(is_active, priority desc, starts_at, ends_at);
create index if not exists idx_bonus_rules_trigger_campaign
  on public.bonus_rules(trigger_event, campaign_id);
create index if not exists idx_device_fingerprints_fingerprint
  on public.device_fingerprints(fingerprint);
create index if not exists idx_fraud_flags_user_created
  on public.fraud_flags(user_id, created_at desc);

-- 3) Atomic reward lock acquisition.
create or replace function public.reward_lock_acquire(
  p_reward_key text,
  p_reward_type text,
  p_source_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.reward_locks%rowtype;
  v_inserted boolean := false;
begin
  insert into public.reward_locks (
    reward_key,
    reward_type,
    source_id,
    metadata
  )
  values (
    p_reward_key,
    p_reward_type,
    p_source_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (reward_key) do nothing
  returning * into v_row;

  v_inserted := found;

  if not v_inserted then
    select * into v_row
    from public.reward_locks
    where reward_key = p_reward_key;
  end if;

  return jsonb_build_object(
    'acquired', v_inserted,
    'lock', to_jsonb(v_row)
  );
end;
$$;

-- 4) Atomic wallet mutation with transaction creation in one db transaction.
create or replace function public.wallet_apply_atomic(
  p_user_id uuid,
  p_balance_field text,
  p_direction text,
  p_amount_uzs bigint,
  p_tx_kind text,
  p_service_type text default null,
  p_order_id uuid default null,
  p_description text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.wallets%rowtype;
  v_delta bigint;
  v_balance_before bigint;
  v_balance_after bigint;
  v_tx_id uuid;
  v_now timestamptz := now();
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if p_balance_field not in ('balance_uzs', 'bonus_balance_uzs') then
    raise exception 'Unsupported balance field: %', p_balance_field;
  end if;

  if p_direction not in ('credit', 'debit') then
    raise exception 'Unsupported direction: %', p_direction;
  end if;

  if coalesce(p_amount_uzs, 0) <= 0 then
    raise exception 'Amount must be > 0';
  end if;

  insert into public.wallets (
    user_id,
    balance_uzs,
    bonus_balance_uzs,
    reserved_uzs,
    total_topup_uzs,
    total_spent_uzs,
    total_earned_uzs,
    is_frozen
  )
  values (
    p_user_id,
    0,
    0,
    0,
    0,
    0,
    0,
    false
  )
  on conflict (user_id) do nothing;

  select * into v_wallet
  from public.wallets
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'Wallet not found for user %', p_user_id;
  end if;

  if coalesce(v_wallet.is_frozen, false) then
    raise exception 'Wallet is frozen';
  end if;

  v_delta := case when p_direction = 'credit' then p_amount_uzs else -p_amount_uzs end;
  v_balance_before := case when p_balance_field = 'bonus_balance_uzs' then coalesce(v_wallet.bonus_balance_uzs, 0) else coalesce(v_wallet.balance_uzs, 0) end;
  v_balance_after := v_balance_before + v_delta;

  if v_balance_after < 0 then
    raise exception 'Insufficient funds in %', p_balance_field;
  end if;

  if p_balance_field = 'bonus_balance_uzs' then
    update public.wallets
    set
      bonus_balance_uzs = v_balance_after,
      total_earned_uzs = case when p_direction = 'credit' then coalesce(total_earned_uzs, 0) + p_amount_uzs else coalesce(total_earned_uzs, 0) end,
      total_spent_uzs = case when p_direction = 'debit' then coalesce(total_spent_uzs, 0) + p_amount_uzs else coalesce(total_spent_uzs, 0) end,
      updated_at = v_now
    where user_id = p_user_id;
  else
    update public.wallets
    set
      balance_uzs = v_balance_after,
      total_earned_uzs = case when p_direction = 'credit' and p_tx_kind in ('topup','order_payout','refund','manual_adjustment') then coalesce(total_earned_uzs, 0) + p_amount_uzs else coalesce(total_earned_uzs, 0) end,
      total_spent_uzs = case when p_direction = 'debit' then coalesce(total_spent_uzs, 0) + p_amount_uzs else coalesce(total_spent_uzs, 0) end,
      total_topup_uzs = case when p_direction = 'credit' and p_tx_kind = 'topup' then coalesce(total_topup_uzs, 0) + p_amount_uzs else coalesce(total_topup_uzs, 0) end,
      updated_at = v_now
    where user_id = p_user_id;
  end if;

  insert into public.wallet_transactions (
    user_id,
    direction,
    kind,
    service_type,
    amount_uzs,
    order_id,
    description,
    metadata,
    meta,
    created_at
  )
  values (
    p_user_id,
    p_direction,
    p_tx_kind,
    p_service_type,
    p_amount_uzs,
    p_order_id,
    p_description,
    coalesce(p_metadata, '{}'::jsonb),
    coalesce(p_metadata, '{}'::jsonb),
    v_now
  )
  returning id into v_tx_id;

  select * into v_wallet
  from public.wallets
  where user_id = p_user_id;

  return jsonb_build_object(
    'wallet_transaction_id', v_tx_id,
    'wallet', to_jsonb(v_wallet),
    'metadata', coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

grant execute on function public.reward_lock_acquire(text, text, uuid, jsonb) to authenticated, service_role;
grant execute on function public.wallet_apply_atomic(uuid, text, text, bigint, text, text, uuid, text, jsonb) to authenticated, service_role;

comment on function public.reward_lock_acquire(text, text, uuid, jsonb) is 'Atomic reward idempotency lock acquisition';
comment on function public.wallet_apply_atomic(uuid, text, text, bigint, text, text, uuid, text, jsonb) is 'Atomic wallet update + wallet_transactions insert';

commit;
