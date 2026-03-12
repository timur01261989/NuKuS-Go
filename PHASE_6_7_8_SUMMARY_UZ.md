# UniGo 6-7-8 bosqich summary

## Qo'shilganlar

### 6. SQL cleanup
- `sql/32_phase6_sql_cleanup.sql`
- `sql/32_phase6_sql_cleanup.md`

### 7. Legacy cleanup plan
- `sql/33_phase7_legacy_cleanup_plan.sql`
- `sql/33_phase7_legacy_cleanup_plan.md`

### 8. Driver order matching engine
- `sql/34_phase8_driver_matching_engine.sql`
- `sql/34_phase8_driver_matching_engine.md`

## Kod o'zgarishi

### Server dispatch search
Yangilandi:
- `server/_shared/orders/orderDriverSearch.js`
- `server/_shared/orders/orderDispatchBatch.js`

## Yangi matching qoidasi

Canonical matching source:
- `driver_presence`
- `driver_service_settings`
- `vehicles`
- `driver_applications`

## Legacy audit scope

- `drivers`
- `driver_profiles`
- `inter_prov_trips`
- `transactions`
- `billing_transactions`

## Muhim eslatma

Bu paket frontend va server kodni yangi matching engine bilan tayyorlaydi.
SQL migratsiyalarni bazaga apply qilgandan keyin RPC qatlam to'liq ishlaydi.
Agar migration hali apply qilinmagan bo'lsa, server JS fallback canonical qoidalar bilan ishlaydi.
