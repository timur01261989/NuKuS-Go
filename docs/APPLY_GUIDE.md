# Apply Guide (Do not delete your existing code)

1) Copy these folders into your repo (merge):
- server/_shared/
- server/api/
- src/native/
- src/analytics/
- sql/
- docs/

2) Add routes in your server router (depends on your framework):
- /api/presence -> server/api/presence.js
- /api/dispatch -> server/api/dispatch.js
- /api/offer/respond -> server/api/offer.js (export respond)
- /api/push/register -> server/api/push_register.js (export register)
- /api/push/send -> server/api/push_send.js
- /api/analytics -> server/api/analytics.js

3) In your Driver UI:
- When driver toggles Online:
  - initPush() -> token -> POST /api/push/register
  - startHeartbeat(...)
- When Offline:
  - stopHeartbeat()

4) Dispatch loop:
- When an order is created: call POST /api/dispatch with order_id (+ pickup/dropoff).
- Repeat every 15s until accepted (or run cron worker).