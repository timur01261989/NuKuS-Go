# UniGo — Unified ID + Reward/Referral Invite Flow + Verification Status

Bu paket referral invite flow, unified user id reward engine integratsiyasi va reward/referral/promo qatlamidagi SQL/Backend hardening bilan yig'ilgan yakuniy variant.

## Paket ichida nima bor

- unified `auth.users.id -> user_id` modeli bilan ishlaydigan reward foundation
- reward lock + wallet atomic update RPC lar
- referral invite flow (`Do'stingni taklif qil` + share link + register auto-fill + auto-apply)
- promo/referral/reward audit hujjatlari
- deploy va verification izlari

## Asosiy yakuniy qarorlar

### Identity
Canonical identity qoidasi:

```text
auth.users.id = profiles.id = wallets.user_id = orders.user_id = ...
```

### Reward / wallet
Canonical reward write qoidasi:

- reward idempotency: `reward_lock_acquire(...)`
- wallet mutation: `wallet_apply_atomic(...)`
- `wallet_transactions` ichida canonical JSON ustun: `metadata`
- legacy `meta` ustuni cleanup qilingan

### Referral UX
Referral input faqat register/onboarding vaqtida ishlaydi.
Ro'yxatdan o'tib bo'lgan user referral kod kiritmaydi.
Ro'yxatdan o'tgan user esa o'z referral havolasini share qiladi.

## Referral invite flow

Repo ichida ishlangan qism:

- `Do'stingni taklif qil` sahifasi qo'shildi: `/client/referral`
- public invite landing route qo'shildi: `/r/:code` va `/invite/:code`
- register sahifasiga referral input qo'shildi
- invite link orqali kirilganda referral kod register formasiga avtomatik tushadi
- OTP tasdiqlangandan keyin referral kod backendga avtomatik apply qilinadi
- profile sahifasiga invite CTA qo'shildi
- sidebar ichiga referral bo'limi qo'shildi
- public resolve endpoint qo'shildi: `GET /api/referral?action=resolve&code=...`
- avatar upload client-side image compression bilan kuchaytirildi

### Referral product qoidasi

1. Ro'yxatdan o'tgan user referral havolasini ko'radi va share qiladi.
2. Yangi user link orqali kiradi yoki ixtiyoriy tarzda referral kodni register paytida kiritadi.
3. Register bo'lgandan keyin referral kod kiritish oynasi yopiladi.
4. Referral reward immediate emas, qualified event bo'lganda reward engine orqali beriladi.

## Verification status — real tekshiruvdan o'tgan joylar

Quyidagi bandlar real SQL tekshiruvlari va smoke testlar bilan tasdiqlangan:

### 1. `sql/99_unigo_reward_engine_cutover.sql` bazada muvaffaqiyatli o'tgan
Natija:

```text
Success. No rows returned
```

Bu quyidagilar yaratilib/o'rnatilganini tasdiqlaydi:

- `reward_lock_acquire(...)`
- `wallet_apply_atomic(...)`
- reward / wallet indekslari
- schema drift hardening bloklari

### 2. `reward_locks` jadvali duplicate unique indextan tozalangan
Final holat:

- `reward_locks_pkey`
- `reward_locks_reward_key_key`
- `idx_reward_locks_reward_type_created`

Bu reward idempotency lock qatlamida keraksiz duplicate unique index qolmaganini bildiradi.

### 3. `wallet_transactions` canonical holatga o'tkazilgan
Tasdiqlangan final schema:

- `metadata` mavjud
- `meta` olib tashlangan

Final index:

- `uq_wallet_transactions_reward_key` faqat `metadata ->> 'reward_key'` ga qaraydi
- `uq_wallet_transactions_order_settlement` mavjud

Bu reward idempotency endi canonical `metadata` ustuni bilan ishlashini bildiradi.

### 4. `wallet_apply_atomic()` metadata-only varianta o'tgan
Funksiya definition tekshiruvda quyidagisi tasdiqlangan:

- `wallet_transactions.meta` ga insert qolmagan
- faqat `metadata` ga yozadi
- wallet create/update va wallet transaction write bitta atomar oqimda ishlaydi

### 5. `wallet_apply_atomic()` real user bilan smoke test o'tgan
Real mavjud `auth.users.id` bilan test qilingan va quyidagilar muvaffaqiyatli olingan:

- wallet yaratildi yoki topildi
- `bonus_balance_uzs = 1000`
- `total_earned_uzs = 1000`
- `wallet_transaction_id` qaytdi
- `wallet_transactions` ga `metadata.reward_key` bilan row yozildi

Bu reward-path runtime darajada ishlayotganini tasdiqlaydi.

### 6. `reward_lock_acquire()` idempotency testi o'tgan
Bir xil reward key bilan 2 marta tekshiruv qilingan:

- 1-chaqiriq: `acquired = true`
- 2-chaqiriq: `acquired = false`

Bu duplicate reward berilishiga qarshi DB-level himoya real ishlayotganini tasdiqlaydi.

### 7. Frontend production build o'tgan
Referral invite flow qo'shilgan frontend build ishlab chiqqan.
Bu route/import darajasida asosiy frontend integratsiya yiqilmaganini bildiradi.

## Nima hali tashqi release config talab qiladi

Quyidagi qism repo ichida 100% yakunlanmaydi, production release konfiguratsiya talab qiladi:

- Android App Links verified setup
- iOS Universal Links verified setup
- production domain (`go.unigo.uz` kabi)
- `assetlinks.json`
- `apple-app-site-association`
- Android signing fingerprint
- App Store / Play Store final listing url

Shuning uchun install-dan keyingi native deferred deep link attribution oqimi repo logikasi bilan tayyorlangan bo'lsa ham, production release config ulanmasdan 100% yakuniy deb hisoblanmaydi.

## Hali qolgan texnik qarzlar

Ushbu paket reward/referral/promo qatlamini ishlab beradi, lekin butun loyiha bo'ylab barcha performance debt tugagan degani emas.
Quyidagilar hali alohida pass talab qiladi:

- reward-path tashqarisidagi `select('*')` larni tozalash
- reward-path tashqarisidagi legacy query patternlar
- barcha xizmatlar bo'yicha end-to-end QA
- release signing + store attribution integratsiyasi

## Muhim hujjatlar

- `README_UNIFIED_USER_ID_UZ.md`
- `REFERRAL_INVITE_FLOW_NOTES.md`
- `REWARD_ENGINE_AUDIT.md`
- `UNIFIED_ID_BONUS_REFERRAL_CLEANUP_INTEGRATION.md`
- `UNIFIED_ID_BONUS_REFERRAL_PATCH.md`

## Deploy tavsiya tartibi

1. Bazada canonical reward migrationlar run qilingan bo'lishi kerak.
2. Backend deploy qilinadi.
3. Frontend deploy qilinadi.
4. Referral route va register auto-fill tekshiriladi.
5. Reward smoke testlar qayta o'tkaziladi.
6. Production domain + store link config ulanadi.

## Yakuniy hukm

Bu paket shunchaki kod yig'indisi emas.
Repo ichida reward/referral foundation real SQL tekshiruvlari bilan verifikatsiya qilingan, schema drift muammolari tozalangan, `metadata` canonical qilingan va referral invite flow app oqimiga ulangan.

Production release uchun qolgan asosiy ish — tashqi verified deep link konfiguratsiyasi va umumiy loyiha bo'ylab keyingi performance pass.
