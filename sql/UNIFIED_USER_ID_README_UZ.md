# UniGo unified user_id patch

Bu patch siz yuborgan SQL strukturasiga qarab tayyorlandi.

## Maqsad
Barcha modullarda bitta universal identifikator ishlashi:

- profiles.id
- driver_applications.user_id
- driver_documents.user_id
- orders.user_id
- wallets.user_id
- transactions.user_id
- auto market owner_user_id / user_id

## Nega patch kerak
Sizning hozirgi schema'da:
- driver_applications, drivers, wallets va boshqa jadvallar `user_id` bilan ishlaydi
- lekin `orders` hali `client_id` bilan yurib turibdi

Bu patch:
1. `orders.user_id` ni qo'shadi
2. eski `client_id` ni `user_id` ga backfill qiladi
3. yangi insert/update paytida `user_id` va `client_id` ni sync qiladi
4. RLS policylarni `user_id = auth.uid()` qoidasi bo'yicha qayta yaratadi

## Muhim
Bu patch `client_id` ni birdan o'chirmaydi.
Sababi: frontend/backend ichida hali `client_id` ishlatilayotgan joylar bo'lishi mumkin.

Shuning uchun bu **xavfsiz o'tish (transition) patch**:
- source of truth = `orders.user_id`
- compatibility = `orders.client_id`
- trigger ikkalasini sync qiladi

## Run qilish tartibi
1. `sql/17_unified_user_id_orders_patch.sql`
2. `sql/18_unified_user_id_rls_patch.sql`

## Keyingi bosqich
Kod ham `client_id` emas, `user_id` ga o'tkazilishi kerak:
- server/api/order.js
- src/features/client/taxi/lib/taxiOrderAdapter.js
- src/features/client/taxi/hooks/useTaxiOrderCreate.js

## Tekshirish
SQL Editor'da:

```sql
select id, user_id, client_id, driver_id, status
from public.orders
order by created_at desc
limit 20;
```

Agar yangi orderlarda `user_id = client_id` bo'lsa, patch ishlagan bo'ladi.
