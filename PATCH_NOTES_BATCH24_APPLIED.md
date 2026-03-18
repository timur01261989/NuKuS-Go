
# Batch 24 Applied

## Focus
Initial integration-test batch for critical business flows without changing runtime behavior.

## Changes
- Exported `__testables` from `server/api/payments.js` for wallet flow integration coverage.
- Added in-memory Supabase mock helper for integration-style tests.
- Added wallet reserve/capture/duplicate-capture coverage.
- Added access-state flow coverage for pending/approved driver scenarios.
- Added Auto Market mode policy integration coverage.
- Added Batch 24 structure test.
