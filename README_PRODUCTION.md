# UniGo (Nukus Taxi) - Production Architecture

## Serverless API (Vercel)
This project uses a **single** Vercel Serverless Function: `api/index.js`.
All routes are mounted there and dispatch to handlers in `server/api/*.js`.

### Required env vars (Vercel Project Settings → Environment Variables)
- `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`)
- `SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `SUPABASE_SERVICE_ROLE_KEY`  ✅ required for server-side inserts/updates (bypasses RLS)

### Security note
Because `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS, every handler MUST validate the user token and enforce access rules.
This is done via `server/middleware/auth.js` + `server/lib/supabase.js`.

## Fix included
- `server/api/order.js` rewritten:
  - Reads `Authorization: Bearer <access_token>`
  - Sets `passenger_id` automatically from token user id
  - Converts client payload (`from_*`, `to_*`) into DB schema (`pickup`, `dropoff` jsonb)
  - Supports actions: create / get / cancel (+ accept/complete optional)

