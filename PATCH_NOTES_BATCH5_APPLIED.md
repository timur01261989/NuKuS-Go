# PATCH NOTES — Batch 5 Applied

## Scope
Infra, observability, production config hardening, and basic regression tests.

## Applied changes

### 1. Nginx gateway hardening
- Added upstream balancing hints and keepalive
- Added proxy headers, timeouts, and upload size limit
- Added dedicated SSE-safe locations for `/api/event-stream` and `/ai/jobs/*`
- Added `/health` endpoint response in gateway

### 2. Kubernetes manifests hardening
- Added labels, env placeholders, readiness/liveness probes, and resource limits to API deployment
- Added worker command, env placeholders, and resource limits to worker deployment
- Added API Service manifest

### 3. Monitoring config hardening
- Expanded Prometheus scrape config for API, worker, Python AI, and Redis exporter

### 4. Observability access control
- `server/api/observability.js` is now admin-only after auth
- Added reusable `isObservabilityAdminProfile(...)` helper

### 5. Service worker refresh
- Bumped SW cache version
- Preserved driver canonical route compatibility

### 6. Regression tests added
- `tests/observability-auth.test.js`
- `tests/infra-config.test.js`

## Notes
- No legacy files were deleted
- No feature surface was intentionally reduced
- Deployment model is still multi-mode, but infra files are now safer baselines
