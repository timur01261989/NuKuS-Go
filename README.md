# NUKUS TAXI (Web + Vercel + Supabase)

## What this is
- Passenger web app + Driver web app
- Vercel serverless API (Node) as the only backend
- Supabase Postgres for data + auth
- Designed to stay stable with 10,000+ online drivers by:
  - strict ID model (single user id)
  - fresh-driver filtering (TTL)
  - DB-side nearest-driver selection (no huge JS sorting)
  - offer queue (one active offer per order)

## Single-ID rule (non‑negotiable)
Supabase Auth creates the only identity:
- `auth.users.id` is the ID for everyone.
- Passenger ID = that user id.
- Driver ID = that same user id (driver is just a role).

Tables must follow:
- `orders.passenger_id = auth.users.id`
- `orders.driver_id = auth.users.id` (when assigned)
- `driver_presence.driver_id = auth.users.id`

## Setup
1) Install deps
- `npm install`

2) Configure environment
- Copy `.env.example` to `.env`
- Fill:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server only)

3) Apply database schema
- Open Supabase Dashboard → SQL Editor
- Run `supabase.sql` from this repo

4) Run locally
- `npm run dev`

## Deploy (Vercel)
- Import the repo
- Add environment variables (same as `.env`)
- Deploy

## Health checks
- Driver online should create/update a row in `driver_presence`
- `driver_presence.updated_at` must keep updating (heartbeat)
- Passenger order should get assigned to a driver via offers/dispatch
