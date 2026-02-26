# UniGo — SQL Schema Fayllar Qo'llanmasi

## Qaysi faylni qachon ishga tushirish kerak?

Tartibi muhim! Quyidagi tartibda ishga tushiring:

### 1. Boshlang'ich o'rnatish (birinchi marta)

```
1. supabase_min_auth_schema_FIXED.sql     — Auth (profiles, roles)
2. supabase_schema.sql                    — Asosiy jadvallar (orders, drivers, ...)
3. supabase_taxi_full_schema_rls.sql      — Taxi: driver_presence, order_offers, messages, RLS
4. supabase_full6_features.sql            — Notifications, wallet, promo, driver_stats, traffic
5. supabase_orders_alter.sql              — orders jadvaliga qo'shimcha columnlar
6. supabase_order_status_notifications.sql — Order status notification triggerlar
7. supabase_yandex_order_extensions.sql   — Kengaytirilgan order fieldlari
8. supabase_performance_indexes.sql       — ⚡ Performance indexes + wallet atomic transfer (YANGI)
```

### 2. Kelajakda (haydovchilar 500+ bo'lganda)

```
9. supabase_postgis_geo_index.sql         — PostGIS geo index (YANGI — faqat kerak bo'lganda)
```

## Fayllar tavsifi

| Fayl | Maqsad |
|------|--------|
| `supabase_min_auth_schema_FIXED.sql` | profiles, auth trigger |
| `supabase_schema.sql` | orders, drivers, driver_applications |
| `supabase_schema_and_policies.sql` | Eski variant (ehtiyot uchun) |
| `supabase_taxi_full_schema_rls.sql` | driver_presence, order_offers, messages, sos_tickets + RLS |
| `supabase_full6_features.sql` | notifications, wallets, promo_codes, driver_stats, traffic_zones |
| `supabase_orders_alter.sql` | orders jadvaliga qo'shimcha columnlar |
| `supabase_order_status_notifications.sql` | Trigger: status o'zgarganda notification |
| `supabase_yandex_order_extensions.sql` | orders uchun kengaytirilgan fieldlar |
| `supabase_performance_indexes.sql` | ⚡ Composite indexes + transfer_wallet_funds() funksiyasi |
| `supabase_postgis_geo_index.sql` | 🗺️ PostGIS geo index (500+ haydovchi uchun) |
