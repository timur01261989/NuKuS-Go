# AUTO MARKET MODE POLICY

## Canonical mode variable
- `VITE_AUTO_MARKET_MODE`

## Allowed values
- `mock`
- `backend`

## Rules
- Development default: `mock`
- Production default: `backend`
- Production must not silently stay in mock mode
- Backend-capable screens/services should surface an actionable error when backend mode is required but unavailable

## Notes
- `marketApi.js` is the mock storage/data layer
- `marketBackend.js` is the Supabase/backend layer
- UI must know which mode is active only through shared helpers, not ad-hoc env checks
