# UniGo Super App — Supabase DB qayta qurish paketi

Bu paket eski aralash SQL fayllarni ishlatmasdan, **bitta yagona ID (`auth.users.id`)** asosida yangi toza schema qurish uchun tayyorlandi.

## Asosiy qoidalar

- Har bir foydalanuvchi uchun **bitta ID** ishlatiladi.
- Shu ID quyidagilarning hammasida ishlatiladi:
  - `profiles.id`
  - `driver_applications.user_id`
  - `drivers.user_id`
  - `driver_presence.driver_id`
  - `wallets.user_id`
  - `orders.client_id`
  - `orders.driver_id`
  - `auto_market_ads.owner_user_id`
  - `billing_transactions.user_id`
- Admin panel bu loyiha ichida emas. Shu sababli DB faqat API yoki tashqi web-admin orqali boshqarishga tayyorlangan.
- Engil mashina barcha xizmatlarni ko‘rishi mumkin, lekin **yuk tashish** uchun og‘irlik cheklovi ishlaydi.

## Transport turlari

`transport_type` quyidagilardan biri bo‘ladi:
- `light_car`
- `bus_gazel`
- `truck`

## Xizmatlar

`service_type` quyidagilardan biri bo‘ladi:
- `taxi`
- `delivery`
- `inter_district`
- `inter_city`
- `freight`
- `auto_market`

## Driver logikasi

### 1) Driver ariza topshiradi
`driver_applications` ga yoziladi:
- `user_id`
- `transport_type`
- hujjatlar
- `status = pending`

### 2) Tashqi admin panel approve qiladi
Approve qilinganda:
- `driver_applications.status = approved`
- `drivers` ga row yaratiladi yoki yangilanadi
- `drivers.allowed_services` avtomatik to‘ldiriladi
- `drivers.is_verified = true`
- `driver_presence` tayyor row yaratilib qo‘yiladi

### 3) Ruxsatlar
#### `light_car`
- `taxi`
- `delivery`
- `inter_district`
- `inter_city`
- `freight`

Lekin `freight` uchun og‘irlik cheklovi ishlaydi:
- tavsiya default: `max_freight_weight_kg = 100`
- dispatch paytida order og‘irligi shu limitdan katta bo‘lsa, yengil mashinaga ko‘rinmaydi

#### `bus_gazel`
- `delivery`
- `inter_district`
- `inter_city`
- `freight`

Tavsiya default:
- `max_freight_weight_kg = 1500`

#### `truck`
- `freight`

Tavsiya default:
- `max_freight_weight_kg = 20000`

## SQL bajarish tartibi

Agar eski test ma'lumotlar saqlanmasin desangiz:
1. `00_reset_unigo_superapp.sql`
2. `01_unigo_superapp_schema.sql`
3. `02_unigo_superapp_rls.sql`

Agar schema allaqachon bo‘sh bo‘lsa:
1. `01_unigo_superapp_schema.sql`
2. `02_unigo_superapp_rls.sql`

## Muhim eslatma

`00_reset_unigo_superapp.sql` destructive fayl. U eski jadvallarni o‘chiradi. Production bazada ishlatishdan oldin backup oling.

## Frontend / backend uchun majburiy moslashuvlar

### Driver register form
Quyidagi majburiy fieldlar bo‘lishi kerak:
- `transport_type`
- `seat_count`
- `max_freight_weight_kg`
- `payload_volume_m3`
- `can_luggage`
- kerakli hujjatlar

### Order yaratishda
`orders` ga yoziladi:
- `client_id`
- `service_type`
- `cargo_weight_kg` (agar freight bo‘lsa)
- `pickup`
- `dropoff`
- `payment_method`

### Order accept
Frontend to‘g‘ridan update qilmaydi.
Faqqat quyidagi RPC ishlatiladi:
- `public.accept_order_atomic(order_id uuid, driver_id uuid)`

### Auto market
Avto savdo e’lonlari ham shu user ID bilan yaratiladi:
- `auto_market_ads.owner_user_id = auth.users.id`

### To‘lovlar
Hammasi bitta wallet / billing qatlamidan o‘tadi:
- topup
- spending
- commission
- ad fee
- order fee
- refund

