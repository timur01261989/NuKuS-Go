# UniGo production fix

## Tuzatilgan joylar
- `src/features/client/taxi/ClientTaxiPage.impl.jsx`
  - `savedPlaces.length` crash bartaraf qilindi
  - `savedPlaces.slice(...)` crash bartaraf qilindi
  - `dispatchLine.length` crash bartaraf qilindi
- `src/features/client/taxi/hooks/useTaxiOrder.core.js`
  - `savedPlaces` doim array bo'ladigan qilindi
  - `shortcuts` safe restore qilindi
- `src/features/client/taxi/hooks/useTaxiOrderCreate.js`
  - Supabase auth user ID bevosita olinadi
  - access token serverga Bearer qilib yuboriladi
  - fallback storage resolution saqlandi
- `src/features/client/taxi/lib/taxiOrderAdapter.js`
  - pickup/dropoff endi `latlng` va `coords` ni ham qaytaradi
  - eski va yangi schema birga ishlaydi
- `server/api/order.js`
  - unified `user_id/client_id` oqimi saqlandi
  - legacy maydonlar ham select/insert qilinadi
  - response shape frontend bilan moslashtirildi
- `sql/19_orders_production_fix_unified_user_id.sql`
  - orders uchun unified user id patch
  - grants + RLS cleanup + backfill

## Ishga tushirish tartibi
1. Zip ichidagi fayllarni loyiha ustiga yozing.
2. Supabase SQL Editor'da `sql/19_orders_production_fix_unified_user_id.sql` ni ishga tushiring.
3. Vercel redeploy qiling.
4. Brauzerda hard refresh qiling (`Ctrl + F5`).

## Muhim
Bu fix boshqa joylarni qisqartirmaydi. Faqat crash va orders oqimini barqaror qiladi.
