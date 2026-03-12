# UniGo 7-bosqich: Legacy cleanup plan

Audit scope:

- `drivers`
- `driver_profiles`
- `inter_prov_trips`
- `transactions`
- `billing_transactions`

## Audit xulosasi

### drivers
Drop qilishga tayyor emas.
Sabab:
- `driver_presence.driver_id` foreign key hali `drivers(user_id)` ga bog'langan
- eski SQL funksiyalar va approval triggerlar bu qatlamni tarixiy tayanch sifatida ishlatadi

### driver_profiles
Runtime kod auditida aktiv reference topilmadi.
Lekin row-level audit qilmasdan drop qilish xato.

### inter_prov_trips
Canonical qatlam `interprov_trips`, lekin legacy nomdagi jadval hali mavjud.
Avval row parity va write freeze qilish kerak.

### transactions
Runtime reference topilmadi.
Lekin moliyaviy reconciliation qilinmasdan drop qilish mumkin emas.

### billing_transactions
Hali tarixiy billing semantics saqlanib qolgan qatlam.
UI va eksportlar to'liq ko'chmagan bo'lishi mumkin.

## SQL metadata

Bu bosqich quyidagilarni qo'shadi:

- `app_meta.legacy_cleanup_registry`
- `app_meta.v_legacy_cleanup_plan`
- `app_meta.v_legacy_cleanup_actions`
