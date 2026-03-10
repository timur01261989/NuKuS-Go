# UniGo Super App

Bu paket yangi yagona schema asosida tozalangan variant.

## Asosiy qoida
- Bitta user ID: `auth.users.id`
- Shu ID quyidagi hamma joyda ishlatiladi:
  - `profiles.id`
  - `driver_applications.user_id`
  - `drivers.user_id`
  - `driver_presence.driver_id`
  - `wallets.user_id`
  - `orders.client_id`
  - `orders.driver_id`
  - `auto_market_ads.owner_user_id`
  - `auto_market_payments.user_id`

## SQL ishga tushirish tartibi
1. `sql/00_reset_unigo_superapp.sql`
2. `sql/01_unigo_superapp_schema.sql`
3. `sql/02_unigo_superapp_rls.sql`
4. `sql/03_unigo_compat_feature_tables.sql`

## Muhim o'zgarishlar
- `profiles.user_id` fallback olib tashlangan, endi faqat `profiles.id`
- `orders.passenger_id` o'rniga `orders.client_id`
- driver online/offline markazi `driver_presence`
- `drivers` jadvali statik capability uchun qoldirilgan
- ortiqcha audit va checklist hujjatlari olib tashlangan
- eski root SQL fayllari olib tashlangan

## Eslatma
Bu paket katta rework qilingan variant. Build va runtime testni lokal yoki Vercel muhitingizda tekshirish kerak.

## Single ID arxitektura

- `auth.users.id` barcha asosiy jadvallarda yagona identifikator sifatida ishlatiladi.
- `profiles.id`, `drivers.user_id`, `driver_presence.driver_id`, `wallets.user_id`, `orders.client_id`, `orders.driver_id`, `auto_market_ads.owner_user_id`, `auto_market_payments.user_id` shu modelga bog'langan.
- Legacy fallback API maydonlari imkon qadar tozalangan; yangi chaqiruvlarda auth token asosiy manba bo'lishi kerak.


## Phase-12 / Phase-13 additions

This bundle includes auto-scaling queue/worker scaffolding, AI demand prediction, smart dispatch scoring, and demand heatmap SQL migration.
