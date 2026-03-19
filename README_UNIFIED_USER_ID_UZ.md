# UniGo yagona ID tizimi — yakuniy variant

Bu paketda loyiha 100% yagona ID modeli ga moslab tozalandi.

## Canonical identity qoidasi

```text
auth.users.id
  = profiles.id
  = driver_applications.user_id
  = driver_documents.user_id
  = drivers.user_id
  = wallets.user_id
  = orders.user_id
  = delivery_orders.user_id
  = district_trips.user_id
  = district_trip_requests.user_id
  = interprov_trips.user_id
  = inter_prov_seat_requests.user_id
  = auto_market_payments.user_id
  = support_threads.user_id
```

## Olib tashlangan legacy maydonlar

- orders.client_id
- inter_prov_seat_requests.client_user_id
- profiles.user_id
- driver_rating_votes.client_id
- inter_prov_trips duplicate jadvali

## O'zgartirilgan kod fayllari

- server/api/intercity.js
- src/services/supabase/authService.js
- src/modules/client/pages/pages/RootRedirect.jsx
- server/_shared/serverI18n.js

## SQL

Eski tarqoq SQL fayllari olib tashlandi.
Yangi yagona canonical schema fayli:

- sql/00_unigo_unified_id_full_schema.sql

## Deploy tekshiruvi

- orders jadvalida client_id bo'lmasligi kerak
- profiles jadvalida user_id bo'lmasligi kerak
- inter_prov_seat_requests jadvalida client_user_id bo'lmasligi kerak
- driver_rating_votes jadvalida client_id bo'lmasligi kerak

## Yakuniy qoida

```text
user_id = auth.users.id
```
