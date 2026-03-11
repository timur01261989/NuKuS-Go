# Unified user_id patch applied

Ushbu paketda `user_id` markaziy yagona identifikator sifatida mustahkamlandi.

## Nima o'zgardi

- `orders.user_id` canonical identity bo'ldi.
- `orders.client_id` compatibility uchun saqlandi va `user_id` bilan sync qilinadi.
- `server/api/order.js` endi auth token bo'lsa aynan shu user id ni ishlatadi.
- `driver_applications` va `driver_documents` frontendi `user_id` bo'yicha qat'iy ishlaydi.
- `driver_documents` yuklashdan oldin ariza egasi tekshiriladi.
- `sql/01_unigo_superapp_schema.sql` endi `orders.user_id` ni startdan yaratadi.
- `sql/02_unigo_superapp_rls.sql` endi `orders.user_id = auth.uid()` qoidasi bilan ishlaydi.
- `sql/supabase_driver_documents.sql` amaldagi `driver_applications` schema nomlariga moslandi.

## Tegilgan fayllar

- `server/api/order.js`
- `server/_shared/orders/orderOfferService.js`
- `src/features/client/taxi/lib/taxiOrderAdapter.js`
- `src/features/client/taxi/hooks/useTaxiOrderCreate.js`
- `src/features/driver/DriverRegistration/supabase.js`
- `sql/01_unigo_superapp_schema.sql`
- `sql/02_unigo_superapp_rls.sql`
- `sql/supabase_driver_documents.sql`

## Asosiy qoida

Bitta foydalanuvchi:
- client bo'lsa ham
- driver bo'lsa ham
- hujjat yuklasa ham
- order yaratsa ham

hamma joyda bir xil `user_id` bilan yuradi.
