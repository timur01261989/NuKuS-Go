# UniGo Reward Engine Audit

## What was corrected

1. Deprecated bonus storage was fully cut out of the canonical reward path.
   - Removed creation of `client_bonuses`, `bonus_transactions`, `driver_bonus`, `driver_bonus_ledger` from the integrated schema.
   - Kept destructive drops in the cutover migration so old environments are cleaned on rollout.

2. Reward idempotency was hardened.
   - `reward_lock_acquire(...)` now returns `acquired=true` only for the transaction that actually inserted the lock.
   - Added unique reward-key protection on `wallet_transactions` through `metadata.reward_key` / `meta.reward_key`.
   - Added unique settlement protection for `(user_id, order_id, kind, direction)` on `order_payment` and `order_payout`.

3. Wallet writes were made safer.
   - `wallet_apply_atomic(...)` remains the only reward-path balance mutator.
   - `/server/api/wallet.js` demo topup path now also uses atomic wallet mutation instead of read-modify-write.
   - Wallet history endpoint no longer uses `select('*')`.

4. Referral fraud flow was hardened.
   - Referral reward qualification now re-checks fraud state on order completion.
   - Referrals marked with `fraud_blocked=true` no longer get rewarded later by mistake.
   - Fraud-blocked referrals move to `rejected` with qualification metadata attached.

5. Unified service coverage was widened.
   - Completed-order counting for first-ride logic now includes `orders`, `delivery_orders`, `cargo_orders`, `interprov_trips`, and `district_trips`.

6. API compatibility bugs were fixed.
   - `server/api/gamification.js` now accepts both legacy admin action names and canonical action names.
   - `src/services/gamificationApi.js` now calls the canonical `wallet_bonuses` action and uses canonical admin mutations.

## Remaining non-reward debt

The project still contains many unrelated `select('*')` calls outside the reward-critical path. They were not all rewritten in this pass because the request scope was reward / promo / referral hardening. Reward-path files were prioritized first.

## Deployment order

1. Run `sql/99_unigo_reward_engine_cutover.sql`
2. Deploy backend code
3. Smoke test:
   - promo apply / revert
   - referral apply / qualification
   - first-ride reward
   - driver payout settlement
   - duplicate completion retry
