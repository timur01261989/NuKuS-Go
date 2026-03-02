# UniGo "YandexGo-style" Principles Pack (ORIGINAL)

Generated: 2026-03-02T15:12:51.782391Z

This pack is NOT copied from YandexGo.
It is an ORIGINAL implementation that follows the same operating principles:

- Modular services (taxi/cargo/delivery)
- Heartbeat + TTL presence
- Exclusive offer dispatch
- Trip state machine
- Push notifications (FCM)
- Analytics/event tracking
- Routing-by-road via OSRM (optional)
- Anti-fraud readiness (Play Integrity placeholder)

## What you must configure
Env:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- FCM_SERVER_KEY (simple legacy key)  (better: switch to FCM v1 service account)
- OSRM_BASE_URL (optional)

DB:
Run SQL files in sql/ in Supabase.

Client:
- Use src/native/* in Driver app.
- Call startHeartbeat() when driver goes Online.
- Initialize push and register token to /api/push/register.