# UniGo 8-bosqich: Driver order matching engine

Bu bosqich yagona matching engine beradi.

## Canonical source of truth

Matching faqat shu qatlamga tayanadi:

- `driver_presence`
- `driver_service_settings`
- `vehicles`
- `driver_applications` (`approved` gate)

## Qoida

### Taxi
- `city_passenger = true`
- driver online
- active order yo'q
- location fresh
- seat yetarli

### Delivery
- `city_delivery` yoki berilgan scope bo'yicha mos flag
- vehicle payload limitlaridan chiqmasligi kerak

### Freight
- `city_freight` yoki berilgan scope bo'yicha mos flag
- active vehicle tasdiqlangan bo'lishi kerak
- yuk sig'imga sig'ishi kerak

### Interdistrict
- `interdistrict_passenger`

### Intercity
- `intercity_passenger`

## SQL funksiyalar

- `public.resolve_matching_service_scope(...)`
- `public.resolve_matching_order_type(...)`
- `public.match_order_candidates(...)`
- `public.dispatch_match_order(...)`

## Server integration

Server dispatch endi avval `dispatch_match_order` RPC ni ishlatadi.
Agar migration hali yugurmagan bo'lsa, JS fallback ham xuddi shu canonical qoidalarga tushadi.
