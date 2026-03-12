# UniGo Super App SQL

Ishga tushirish tartibi:

1. `00_reset_unigo_superapp.sql` — eski aralash public jadval va funksiyalarni tozalaydi.
2. `01_unigo_superapp_schema.sql` — yangi asosiy schema: yagona user ID, driver applications, drivers, driver_presence, wallets, orders, auto market.
3. `02_unigo_superapp_rls.sql` — RLS policylar.
4. `03_unigo_compat_feature_tables.sql` — loyiha ichidagi qolgan modullar yiqilib ketmasligi uchun minimal compatibility jadvallari.

Asosiy qoida: `auth.users.id` hamma modul uchun yagona ID bo'lib ishlatiladi.
