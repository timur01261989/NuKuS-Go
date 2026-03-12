# UniGo 4-bosqich: Legacy cutover

Bu bosqichda kod darajasida quyidagi legacy yo'nalishlar canonical jadvallarga ko'chirildi:

- drivers -> profiles + driver_applications + driver_service_settings + vehicles + driver_presence
- inter_prov_trips -> interprov_trips
- wallet legacy yo'nalishlari keyingi bosqichda wallet_transactions ga to'liq ko'chiriladi

## Kodda qilingan asosiy o'zgarishlar
- auth/session qatlamida driver access endi `fetchDriverCore()` orqali olinadi
- driver online fallback endi `drivers` jadvaliga yozmaydi
- intercity API va client intercity servislar `interprov_trips` ga o'tdi
- server driver/presence/dispatch qatlamlari tasdiq uchun `driver_applications` asosida ishlaydi

## Hali legacy bo'lib turgan qatlamlar
- drivers
- driver_profiles
- transactions
- billing_transactions

Ularni drop qilish faqat frontend/backend to'liq uzilgandan keyin qilinadi.
