# Batch 23 Applied

Final hardening batch focused on remaining maintainability and consistency gaps:

- Added legacy boundary notes for driver legacy layer and legacy/client page shells.
- Added PWA/service worker policy and logging/error policy docs.
- Hardened Auto Market mode validation with centralized warnings for invalid mode values.
- Extended shared error adapter with `normalizeAppError`.
- Switched key client pages (`Auth`, `Register`, `DeliveryPage`) toward shared logger/error handling.
- Improved a few Auto Market backend throws to use shared user-facing error adapter.
- Bumped service worker version and added old tile-cache cleanup on activate.
- Added `tests/batch23-structure.test.js`.
