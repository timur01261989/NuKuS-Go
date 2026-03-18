# UNIGO Batch 1 patch notes

This batch applies critical, low-regression fixes without changing the core product behavior.

## Patched areas
- Routing compatibility for `/driver/dashboard`
- Legacy route helpers now point to current driver home
- Runtime `cp(...)` crashes fixed in Intercity and Freight pages
- `withAuth(handler)` compatibility restored for endpoints that used wrapper form
- Order GET now supports query params and ownership checks
- Order cancel now checks ownership + cancellable statuses
- Wallet unknown routes now return 404 instead of silently returning balance
- Payment helper now throws if wallet ledger insert fails
- Wallet complete now skips duplicate/double capture attempts
- Auto Market direct `mark-paid` endpoint disabled by default unless explicitly enabled
- OTP send flow no longer stores password in pending metadata
- OTP verify now validates hash only
- `api/index.js` now routes `/api/intercity` and `/api/analytics`

## Notes
- No legacy files were deleted.
- Existing behavior was preserved where possible.
- This is a hardening batch, not a product redesign.
