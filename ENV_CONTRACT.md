# ENV CONTRACT

## Frontend
- `VITE_SUPABASE_URL` (required)
- `VITE_SUPABASE_ANON_KEY` (required)
- `VITE_API_BASE_URL` (preferred)
- `VITE_API_BASE` (compatibility only; keep temporarily)
- `VITE_PYTHON_AI_URL` (optional when AI service is external)
- `VITE_AUTO_MARKET_MODE` (`mock` or `backend`; production should be `backend`)

## Server
- `SUPABASE_URL` (required)
- `SUPABASE_SERVICE_ROLE_KEY` (required)
- `PAYME_MERCHANT_KEY` (required for Payme verify)
- `CLICK_SECRET_KEY` (required for Click verify)
- `ALLOW_AUTO_MARKET_DIRECT_MARK_PAID` (default false; debug only)

## Policy
- Prefer canonical names above.
- Keep compatibility env names only until all deployments migrate.
- Production must not run Auto Market in mock mode.


## Additional policy docs
- See also: `AUTO_MARKET_MODE.md`
- See also: `SCHEMA_POLICY.md`
