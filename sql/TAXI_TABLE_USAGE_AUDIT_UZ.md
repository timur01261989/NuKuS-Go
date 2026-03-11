# UniGo Taxi Table Usage Audit (UZ)

Bu fayl ertaga xato chiqsa, qaysi kod qaysi jadval bilan ishlayotganini tez tushunish uchun yozildi.

## Asosiy tamoyil
- **Yagona universal identity**: `profiles.id` va `auth.users.id`
- Platforma bo'ylab shu identity `user_id` sifatida yuradi.
- `orders.client_id` hali compatibility uchun saqlanadi, lekin canonical source of truth endi `orders.user_id`.

## Jadval -> ishlatiladigan kodlar

### 1. `public.orders`
Vazifa:
- taxi buyurtma
- driver assignment
- status lifecycle
- price / tarif / masofa / payment

Ishlatadigan kodlar:
- `server/api/order.js`
- `server/api/order_status.js`
- `server/api/dispatch.js`
- `src/features/client/taxi/hooks/useTaxiOrderCreate.js`
- `src/features/client/taxi/lib/taxiOrderAdapter.js`
- `src/features/client/taxi/hooks/useTaxiOrder.core.js`

Muhim ustunlar:
- `id`
- `user_id`
- `client_id` (compatibility)
- `driver_id`
- `service_type`
- `status`
- `pickup`
- `dropoff`
- `payment_method`
- `car_type`
- `comment`
- `price_uzs`
- `distance_m`
- `duration_s`
- `surge_multiplier`
- `options`

### 2. `public.driver_applications`
Vazifa:
- haydovchi bo'lish uchun ariza

Ishlatadigan kodlar:
- `sql/supabase_driver_documents.sql`
- driver registration page / driver onboarding qatlamlari

Muhim ustunlar:
- `id`
- `user_id`
- `status`
- `transport_type`

### 3. `public.driver_documents`
Vazifa:
- driver hujjatlari

Ishlatadigan kodlar:
- `sql/supabase_driver_documents.sql`
- driver registration / document upload flow

Muhim ustunlar:
- `id`
- `application_id`
- `user_id`
- `doc_type`
- `file_url`

### 4. `public.drivers`
Vazifa:
- tasdiqlangan driver profile

Ishlatadigan kodlar:
- `server/api/dispatch.js`
- `server/api/driver_heartbeat.js`
- `server/api/offer.js`
- `server/_shared/orders/orderDispatchService.js`

Muhim ustunlar:
- `user_id`
- `is_verified`
- `rating_avg`
- `acceptance_rate`

### 5. `public.driver_presence`
Vazifa:
- driver online/offline, lat/lng, current order

Ishlatadigan kodlar:
- `server/api/dispatch.js`
- `server/api/driver_heartbeat.js`
- `server/_shared/orders/orderDispatchService.js`

### 6. `public.order_offers`
Vazifa:
- driverga order offer berish

Ishlatadigan kodlar:
- `server/api/offer.js`
- `server/_shared/orders/orderOfferService.js`
- `server/_shared/orders/orderDispatchService.js`

### 7. `public.order_events`
Vazifa:
- timeline / audit log

Ishlatadigan kodlar:
- `server/api/order_status.js`
- `server/api/offer.js`
- `server/_shared/orders/orderEvents.js`
- `src/features/client/taxi/hooks/useOrderTimeline.js`

### 8. `public.wallets`
Vazifa:
- user wallet

Ishlatadigan kodlar:
- `server/api/wallet.js`
- `server/api/order_status.js`

### 9. `public.wallet_transactions`
Vazifa:
- wallet ledger

Ishlatadigan kodlar:
- `server/api/order_status.js`
- `server/api/wallet.js`

## Bug chiqqanda tez diagnostika

### `permission denied for table orders`
Tekshirish:
- `sql/18_unified_user_id_rls_patch.sql`
- `server/api/order.js` payload ichida `user_id`
- session user login bo'lganmi

### `Could not find column ... of orders`
Tekshirish:
- `sql/16_city_taxi_compat_patch.sql`
- `sql/17_unified_user_id_orders_patch.sql`

### `pickup kerak` yoki `dropoff kerak`
Tekshirish:
- `src/features/client/taxi/lib/taxiOrderAdapter.js`
- `src/features/client/taxi/hooks/useTaxiOrderCreate.js`
- `server/api/order.js`

### Driverga order bormasa
Tekshirish:
- `public.drivers`
- `public.driver_presence`
- `public.order_offers`
- `server/api/dispatch.js`
- `server/api/offer.js`

## O'zgartirilgan fayllar
- `server/api/order.js`
- `server/api/order_status.js`
- `src/features/client/taxi/lib/taxiOrderAdapter.js`
- `src/features/client/taxi/hooks/useTaxiOrderCreate.js`
- `src/features/client/taxi/services/taxiApi.js`
- `sql/TAXI_TABLE_USAGE_AUDIT_UZ.md`
