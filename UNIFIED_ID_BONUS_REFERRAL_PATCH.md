# UniGo Unified ID + Bonus/Referral Patch

Bu patch quyidagilarni qo'shadi:

- `profiles.phone_normalized` va unique index
- `user_roles` jadvali
- `wallets.bonus_balance_uzs`
- `referral_codes`, `referrals`, `referral_rewards`
- `bonus_campaigns`, `bonus_rules`, `user_bonus_usages`, `bonus_events`, `reward_locks`
- `promo_codes`, `promo_redemptions`
- `server/api/referral.js`
- `server/api/promo.js`
- `server/api/reward_worker.js`
- `src/services/referralApi.js`

## Yangi endpointlar

### Referral
- `GET /api/referral`
- `POST /api/referral` with `{ action: "apply", code, device_hash? }`

### Promo
- `POST /api/promo-validate` with `{ code, order_total_uzs }`
- `POST /api/order-apply-promo` with `{ order_id, code, order_total_uzs }`

### Reward worker
- `POST /api/reward-worker` with `{ action: "process_completed_order", order_id }`

## Muhim eslatma

`server/api/auth.js` ichida demo OTP (`1111`) hali turibdi. Bu patch referral/promo/bonusni productionga yaqinlashtiradi, lekin auth qismi alohida tozalanishi kerak. Real ishlatishda Supabase OTP yagona source bo'lishi shart.
