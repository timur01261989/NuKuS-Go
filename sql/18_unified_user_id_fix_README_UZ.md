# UniGo yagona user_id fix

Bu patch `orders.user_id` ni canonical identity qiladi.

## Asosiy qoida
- `auth.users.id` = universal foydalanuvchi ID
- `orders.user_id` = client/passenger ning canonical ID si
- `orders.client_id` = faqat transition compatibility uchun saqlanadi
- `orders.driver_id` = driver ning universal user ID si

## O'zgartirilgan fayllar
- `sql/02_unigo_superapp_rls.sql`
- `server/api/order.js`
- `src/features/client/taxi/lib/taxiOrderAdapter.js`
- `src/features/client/taxi/hooks/useTaxiOrderCreate.js`
- `src/features/shared/components/RideHistory.jsx`
- `src/features/client/components/TripHistory.jsx`
- `src/features/shared/components/RatingModal.jsx`
- `src/services/checkoutApi.js`

## Qaysi jadvallar xatoni tushunish uchun muhim
- `orders`
- `order_events`
- `order_offers`
- `driver_applications`
- `driver_documents`
- `drivers`
- `wallets`
- `transactions`

## Debug querylar
```sql
select id, user_id, client_id, driver_id, service_type, status, created_at
from public.orders
order by created_at desc
limit 20;
```

```sql
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'orders';
```

```sql
select column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'orders'
order by ordinal_position;
```
