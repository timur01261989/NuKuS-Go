# PWA / SERVICE WORKER POLICY

## Goals
- Cache only static assets and safe map-tile requests.
- Avoid caching authenticated API responses by default.
- Keep route compatibility stable across service worker updates.

## Rules
- Bump service worker version when cache behavior changes.
- Clean old caches during activate.
- Do not hardcode outdated application routes in notification click handlers.
- Prefer explicit policy docs over ad-hoc cache changes.

## Manual smoke checks
- Fresh install
- Update from previous version
- Notification click navigation
- Tile caching while offline
