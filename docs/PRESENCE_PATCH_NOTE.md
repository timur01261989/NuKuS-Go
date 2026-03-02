# Presence payload upgrade (recommended)

Your current endpoint: server/api/presence.js
It accepts: { driver_id, lat?, lng?, state? }

Upgrade to also accept:
- active_service_type
- device_id
- app_version
- platform

And store them to driver_presence.

This enables:
- per-service online drivers
- anti-fraud (device-based)
- debugging by app_version