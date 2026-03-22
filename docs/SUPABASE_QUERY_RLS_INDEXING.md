# Supabase: so‘rovlar, indekslar, RLS

## Qilingan o‘zgarishlar (2026-03)

- `select('*')` o‘rniga aniq ustunlar: `server/_shared/supabaseColumns.js`, `src/data/supabaseColumnLists.js`.
- **orders** API: `ORDER_SELECT` (`order.shared.js`) — `order_status`, `dispatch`.
- **interprov_trips / inter_prov_seat_requests**: `intercity.js`, `dispatch.js`, `intercitySupabase.js`.
- **district_***: `interDistrictTrips.js` (pitak, trip, request + embed).
- **push_tokens**: `token` maydoni (FCM), `role` / `app_version` migratsiya.
- **Xavfsizlik**: `order_status.js` — JWT bilan `user_id` yoki `driver_id` bo‘lmasa **403**; `body.actor_user_id` spoof olib tashlandi.

## Migratsiyalar

| Fayl | Maqsad |
|------|--------|
| `20260322_interprov_trips_parcel_booked.sql` | `parcel_enabled`, `booked_seats`, partial index `(status, depart_at)` |
| `20260322_push_tokens_role_fcm.sql` | `role`, `app_version` |

## Tavsiya etiladigan indekslar (allaqachon sxemada bo‘lishi mumkin)

- **orders**: `(user_id, created_at desc)`, `(driver_id, created_at desc)`, `(status, service_type, created_at desc)` — `00_unigo_unified_id_full_schema.sql` da bor.
- **district_trips**: qidiruv `(region, from_district, to_district, status, depart_at)` — yuqori yuk bo‘lsa kompozit indeks qo‘shing.
- **inter_prov_seat_requests**: `(user_id, created_at desc)`, `(trip_id, created_at desc)`.

## RLS va service role

- **Browser Supabase client** (anon key): RLS qoidalari qo‘llanadi — faqat o‘z qatorlari.
- **Server (`getSupabaseAdmin` / service role)**: RLS **chetlab o‘tadi**. Shuning uchun:
  - `order_status` kabi endpointlarda **iloji boricha** serverda `getAuthedUserId` bilan tekshiruv majburiy.
  - Hech qachon mijozga to‘g‘ridan-to‘g‘ri service key bermang.

## Qolgan `select('*')` lar

Monorepo boshqa servislarida (`services/*`, `apps/api-gateway`) hali ham `*` bor — ularni shu pattern bo‘yicha bosqichma-bosqich qisqartiring.
