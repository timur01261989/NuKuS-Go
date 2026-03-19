# PATCH_NOTES_BATCH3_APPLIED

Batch 3 focuses on API contract stabilization and backend route connectivity.

## Applied fixes

### 1. Explicit serverless route registry
Updated:
- `api/index.js`

What changed:
- Replaced loose `startsWith(...)` dispatching with an explicit route registry.
- Added routeKey assignment per matched endpoint.
- Preserved backward compatibility for existing flat and nested routes.

Connected routes:
- `/api/dispatch-enqueue`
- `/api/dispatch-predictions`
- `/api/dispatch-architecture`
- `/api/city-dispatch`
- `/api/event-stream`
- `/api/pricing-dynamic`
- `/api/intercity`
- `/api/analytics`
- `/api/push/register`
- `/api/push/send`
- `/api/health`
- `/api/observability`
- `/api/partners`
- `/api/settlement`
- `/api/fleet`

Added compatibility aliases:
- `/api/dispatch-match` -> dispatch handler
- `/api/driver_heartbeat` -> driver heartbeat route
- legacy auto-market aliases preserved
- wallet/order aliases preserved

### 2. Driver API hidden runtime bug
Updated:
- `server/api/driver.js`

What changed:
- Added missing `getApprovedDriverCore` import so presence updates do not crash at runtime.

### 3. Push register handler compatibility
Updated:
- `server/api/push_register.js`

What changed:
- Added default export for cleaner routing compatibility from `api/index.js`.

## Notes
- This batch does not remove legacy files.
- This batch keeps the existing product behavior intact while connecting previously orphaned endpoints.
- Routes that still have no backend implementation at all (for example truly missing modules) were not guessed or force-created in this batch.
