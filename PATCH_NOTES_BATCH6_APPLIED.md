# PATCH NOTES — Batch 6 Applied

## Scope
Auth/runtime cleanup, API registry extraction, and regression-test expansion.

## Applied changes

### 1. Runtime bootstrap cleanup
- Added `src/bootstrap/runtimeBootstrap.js`
- Added `src/services/auth/legacyTokenBridge.js`
- Moved legacy token bridge logic out of `src/main.jsx`
- Added cleanup-aware auth bridge subscription
- Client env validation now logs clearly during bootstrap
- Notifications bootstrap is now executed from a single runtime entry point

### 2. AuthProvider stale-state hardening
- Added resolved fingerprint ref to avoid queued-session comparisons against stale closure state
- Reduced coupling between `resolveSession(...)` and render-time state snapshots

### 3. API route registry extraction
- Added `api/routeRegistry.js`
- Moved path normalization and route-to-handler mapping out of `api/index.js`
- Kept existing endpoint behavior and compatibility aliases intact
- Simplified `api/index.js` to routing + body parsing orchestration

### 4. Regression tests expanded
- Added `tests/access-state.test.js`
- Added `tests/api-route-registry.test.js`
- Added `tests/service-worker-routes.test.js`

## Notes
- No feature surface was intentionally reduced
- No legacy files were deleted
- Route compatibility remains preserved while routing internals are easier to test
