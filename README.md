# UniGo Super App Reworked

Bu paket yangi yagona-ID arxitektura asosida tayyorlandi.

Asosiy qoida:
- `auth.users.id` = barcha modul uchun yagona user ID
- client / driver / wallet / orders / auto market hammasi shu ID bilan ishlaydi

## SQL tartibi
1. `sql/00_reset_unigo_superapp.sql`
2. `sql/01_unigo_superapp_schema.sql`
3. `sql/02_unigo_superapp_rls.sql`
4. `sql/03_unigo_compat_feature_tables.sql`

## O'zgargan asosiy oqim
- Driver bo'lish uchun ariza `driver_applications` ga yoziladi
- Tasdiqlangan haydovchi `drivers` da saqlanadi
- Online/offline truth source `driver_presence`
- Orderlar umumiy `orders` jadvalida
- Wallet umumiy `wallets` + `wallet_transactions`
- Avto savdo `auto_market_ads` + `auto_market_payments`

## Muhim
Admin panel bu paket ichida emas. U alohida web loyiha sifatida ishlanadi.
