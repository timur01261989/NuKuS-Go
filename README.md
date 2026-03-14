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


## Referral audit remediatsiya statusi

`unigo_referral_analysis.md` dagi kritik bandlar bo'yicha ushbu paketda quyidagilar tuzatildi:

- ESLint 8 bilan ishlaydigan flat config qayta yozildi. Endi `npm run lint` ishga tushadi va real xatolarni ko'rsatadi.
- Referral reward canonical qiymati `3000` ga tushirildi:
  - `server/_shared/rewards.js`
  - `server/_shared/reward-engine/constants.js`
  - `sql/00_unigo_unified_id_full_schema.sql`
- Public referral resolve endpoint inviter uchun kerakli maydonlarni qaytaradi:
  - `id`
  - `phone`
  - `full_name`
  - `avatar_url`
  va schema drift bo'lsa minimal fallback bilan ishlaydi.
- Referral code click paytida emas, auth/session init vaqtida bootstrap qilinadi.
- Referral sahifasi cached referral snapshot bilan ochiladi; kod bo'lmasa `Taklif kodingiz tayyorlanmoqda...` holati ko'rsatiladi.
- Share button endi kod yo'q paytda qattiq disable holatga o'tadi.
- Desktop fallback uchun single-button share sheet qo'shildi: native share yo'q bo'lsa Telegram / WhatsApp / VK / Nusxa olish modal ochiladi.
- Referral summary endpoint degrade-safe qilindi: summary yoki wallet query yiqilsa ham referral code va share URL qaytarilishi davom etadi.

### Build/Lint current status

Real tekshiruv:

- `npm run build` — **muvaffaqiyatli o'tdi**
- `npm run lint` — **ishga tushadi**, lekin repo bo'ylab oldindan mavjud bo'lgan ko'p lint xatolarini ko'rsatadi

Bu shuni anglatadi:
- tooling pipeline endi singan emas
- referral/remediation patch compile bo'ladi
- lekin butun repo bo'ylab lint debt hali alohida pass talab qiladi


## Qo'shimcha audit remediatsiya — ikkinchi pass

Ushbu passda `unigo_referral_analysis.md` dagi qolgan yuqori prioritet bandlar bo'yicha ham real o'zgarishlar kiritildi.

### 1. Route-level code splitting qayta qurildi
Quyidagi routerlar lazy-loading asosida qayta yozildi:
- `src/app/router/AppRouter.jsx`
- `src/app/router/ClientRoutes.jsx`
- `src/app/router/DriverRoutes.jsx`

Natija:
- main app chunk endi ~`218 kB` atrofida
- taxi / delivery / freight / intercity / wallet / referral alohida route chunklarga bo'lindi
- static + dynamic import aralashmasi referral auditda ko'rsatilgan darajada kamaytirildi

### 2. Prefetch qatlam route wrapperlarga o'tkazildi
`src/services/platform/prefetchService.js` endi ichki feature fayllarni emas, route wrapper sahifalarni prefetch qiladi.
Bu Vite chunk graphni tozaroq qiladi va lazy route bilan bir xil modulni parallel ikki xil usulda tortish muammosini kamaytiradi.

### 3. Hot path `select('*')` lar qisqartirildi
Auditda ko'rsatilgan eng muhim pathlar bo'yicha minimal ustunli queryga o'tkazildi:
- `server/api/delivery.js`
- `server/api/support.js`
- `src/modules/shared/auth/driverCoreAccess.js`
- `server/api/wallet.js` (`meta` drift ham tozalandi)

Bu o'zgarishlar:
- payload hajmini pasaytiradi
- schema couplingni kamaytiradi
- Supabase/Postgres I/O ni yengillashtiradi

### 4. Lint pipeline endi haqiqatan ham o'tadi
Ikkinchi passda ESLint config yana kuchaytirildi va bloklovchi parse/rule xatolar ham tozalandi.
Real tekshiruv:
- `npm run lint -- --quiet` — **muvaffaqiyatli o'tdi**

### 5. Intercity parse/xook xatolari tozalandi
Quyidagi sinayotgan fayllar tuzatildi:
- `src/modules/client/features/client/intercity/components/Drivers/DriverOfferList.jsx`
- `src/modules/client/features/client/intercity/components/Filters/DatePickerSheet.jsx`
- `src/modules/driver/legacy/inter-provincial/hooks/useTripSocket.js`

### 6. Migration truth-source bo'yicha amaliy holat
Canonical referral summa hozir bazaviy schema ichida `3000`.
`sql/100_referral_driver_milestone_program.sql` esa endi faqat:
- referral base rewardni sync qiladi
- driver milestone reward (`5 trips -> 10000`) ni qo'shadi

Yangi environment uchun amaliy qoida:
- fresh bootstrap: `00_unigo_unified_id_full_schema.sql`
- existing prod drift patch: `99` va `100`

Bu hali ideal migration arxitekturasi emas, lekin business-value driftni to'xtatadigan canonical yo'l qo'yildi.

### 7. Build status
Real tekshiruv:
- `npm run build` — **muvaffaqiyatli o'tdi**

Build natijasida route chunking yaxshilandi, lekin `vendor-antd` hali ham og'ir. Bu keyingi alohida UI dependency optimization pass talab qiladi.
