# Final QA Checklist

## Auth
- Login validation works
- Register flow validates OTP request input
- Session restore does not mis-route roles
- Driver pending / approved / rejected access is correct

## Client flows
- Main page loads
- Delivery payload build works
- Referral snapshot and query parsing work
- Saved addresses restore correctly

## Driver flows
- Driver home renders through controller + selectors
- Driver settings load/save flow works
- Driver order feed preserves selected service and availability state

## Payments / Wallet
- Reserve is created before capture
- Duplicate capture is blocked
- Capture prefers reserved amount before balance debit
- Unknown wallet route returns 404

## API
- Unknown API route returns 404 JSON
- Route registry preserves canonical and alias routes
- Intercity and analytics routes are registered

## Auto Market
- Mode policy respects `mock` and `backend`
- Production fallback is backend-safe
- Backend fallback logs with shared logger/error policy

## PWA / SW
- Canonical driver route is used
- Service worker version is bumped on policy changes
- Activate phase clears stale tile caches

## Infra / Config
- ENV contract and `.env.example` are present
- AUTH / ROUTING / SCHEMA policies are present
