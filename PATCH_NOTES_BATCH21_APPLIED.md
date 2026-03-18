# Batch 21 Applied

## Focus
Step 1 of the remaining stabilization plan:
- wallet/payment hardening baseline
- docs/contracts for auth/routing/env
- test suite modernization and coverage extension

## Applied changes
- Added wallet reservation helpers in `server/_shared/payments/helpers.js`
- Added authorization lookup helper in `server/api/payments.shared.js`
- Updated `server/api/payments.js`:
  - prevent duplicate authorization
  - reserve wallet amount during checkout
  - capture from reserved wallet amount on completion
  - fixed paid response amount field in complete flow
- Added docs:
  - `AUTH_ACCESS_MODEL.md`
  - `ROUTING_RULES.md`
  - `ENV_CONTRACT.md`
  - `.env.example`
- Added `tests/batch21-structure.test.js`
- Updated older structure tests to match the current refactored architecture
- Full test run result: 47/47 passing with `node --test tests/*.test.js`

## Notes
- This is still not a full DB transaction/RPC migration.
- It is a safer intermediate hardening step that preserves behavior while reducing duplicate authorization/capture drift.
