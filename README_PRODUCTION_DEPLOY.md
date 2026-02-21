# Nukus Go — Production Pack (Vercel + Node.js)

Bu repo bitta joyda **Frontend (Vite)** va **Backend (Vercel /api)** ni birlashtiradi.

## Deploy (GitHub → Vercel)
1) GitHub repo yarating va shu loyihani push qiling.
2) Vercel → New Project → GitHub repo ni tanlang.
3) Framework: **Vite**
4) Build: `npm run build`
5) Output: `dist`

## Vercel ENV (Project Settings → Environment Variables)
- `AUTH_SECRET` = uzun random string (majburiy)

> `VITE_API_BASE` ni Vercel’da bo‘sh qoldiring — API same-origin ishlaydi.

## API Endpoints
- `POST /api/auth-otp-request`  (demo OTP: 1111)
- `POST /api/auth-otp-verify`
- `GET /api/market-listings?limit=50&sort=newest`
- `POST /api/market-listings`
- `GET /api/orders`
- `POST /api/orders`

## Muhim eslatma (REAL DB uchun)
Hozir `/api/*` **in-memory** store ishlatadi (demo). Production’da:
- Supabase oching
- `supabase_schema.sql` ni ishlating
- Keyin `/api/*` ichida store() o‘rniga Supabase Postgres ulaysiz.

Agar xohlasangiz, keyingi bosqichda men Supabase ulab beradigan variantni ham tayyorlab beraman.


## Supabase ulash (DB + Realtime)
1) Supabase project yarating.
2) SQL editor’da `supabase_schema_and_policies.sql` ni run qiling.
3) Supabase → Database → Replication → Realtime: `orders`, `driver_locations` (va xohlasangiz `market_listings`) ni yoqing.
4) Vercel env qo‘shing:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
5) Deploy qiling.

> Eslatma: bu SQL ichida TEMP open RLS bor (test). Productionda Supabase Auth qo‘shib, policylarni qattiq qilamiz.


## Taxi orders real-time subscribe (Supabase)
1) Frontend env (Vercel):
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
2) Supabase Realtime: `orders`, `driver_locations` yoqilgan bo‘lsin.
3) Tekshirish: deploy URL oxiriga `?debugRealtime=1` qo‘shing. `Order ID` ga order UUID kiriting.

Fayllar:
- src/services/supabaseClient.js
- src/services/ordersRealtime.js
- src/hooks/useOrderRealtime.js
- src/hooks/useDriverLocationRealtime.js
- src/components/taxi/OrderRealtimeDebug.jsx


## Taxi realtime to‘liq bo‘lishi uchun qo‘shildi
API:
- POST /api/driver-location  (driver_locations upsert)
- POST /api/order-status     (orders.status update)

SQL (optional):
- supabase_orders_alter.sql  (accepted_at/arrived_at/... ustunlar)

Frontend helper:
- src/services/ordersApi.js


## All-features (add-only) qo‘shimchalar
- Driver heartbeat: POST /api/driver-heartbeat
- Dispatch: POST /api/dispatch
- Offer respond: POST /api/offer-respond
- Cancel reason: POST /api/order-cancel
- Chat: GET/POST /api/messages + realtime subscribe `src/services/chatRealtime.js`
- SOS: POST /api/sos
- Optional cron expire: GET /api/cron-expire-orders
- Pricing config: public/config/tariffs.json + `src/services/pricingService.js`
- Smoothed GPS hook: `src/hooks/useDriverLocationSmoothed.js`
- Strict RLS SQL: supabase_taxi_full_schema_rls.sql


## Yandex-style add-only order extensions
- SQL: supabase_yandex_order_extensions.sql (pickup/dropoff/route/polyline/eta + linked_orders)
- API: GET /api/eta (simple ETA), GET /api/offer-timeout (cron offer timeout)
- Frontend helper: src/services/orderModel.js


## Full 6 features + hooks (add-only)
- Run SQL: supabase_full6_features.sql
- Run SQL: supabase_order_status_notifications.sql
- Debug providers: add `?debugProviders=1`
- APIs: traffic-eta, heatmap, wallet-balance, wallet-topup-demo, promo-validate, dispatch-smart, driver-state, notify, notifications-read, order-apply-promo, order-pay-wallet, order-complete
