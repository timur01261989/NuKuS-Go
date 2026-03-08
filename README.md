# UniGo

Bu paket yangi **yagona ID** arxitekturaga moslashtirildi.

## Asosiy qoida
- `auth.users.id` hamma joy uchun bitta ID
- `profiles.id`
- `driver_applications.user_id`
- `drivers.user_id`
- `driver_presence.driver_id`
- `wallets.user_id`
- `orders.client_id` / `orders.driver_id`
- `auto_market_ads.owner_user_id`
- `auto_market_payments.user_id`

## SQL ishga tushirish tartibi
Faqat shu fayllar ishlatiladi:
1. `sql/00_reset_unigo_superapp.sql`
2. `sql/01_unigo_superapp_schema.sql`
3. `sql/02_unigo_superapp_rls.sql`

## Driver oqimi
1. User ro'yxatdan o'tadi
2. Driver ariza yuboradi (`driver_applications`)
3. Admin web panel orqali approve/reject qiladi
4. Approve bo'lgach `drivers` capability profili yaratiladi
5. Presence va online holat faqat `driver_presence` orqali yuradi

## Transport turlari
- `light_car`
- `bus_gazel`
- `truck`

`light_car` barcha asosiy xizmatlarni ko'rishi mumkin, ammo freight dispatch faqat haydovchi limiti ichidagi kg uchun chiqadi.

## Muhim o'zgarishlar
- eski aralash SQL fayllar olib tashlandi
- driver registration `drivers` ga pending row yaratmaydi
- driver pending sahifasi `driver_applications` holatiga qaraydi
- online/offline truth source `driver_presence`
- auto market owner/payment ham bitta user ID bilan ishlaydi

## Eslatma
Admin panel bu loyihaga aralashtirilmagan. U alohida web loyiha bo'ladi.
