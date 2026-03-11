# UniGo taxi audit: required tables and why

This audit was generated from the uploaded project. The project already contains most core tables in the SQL migrations. The current runtime failures are caused mainly by a **schema mismatch between the frontend/backend taxi order contract and the existing `public.orders` table**.

## 1. Core tables that already exist and are required

### `public.orders`
Main source of truth for every ride/order.
Why needed:
- stores client and driver relation
- stores `pickup` / `dropoff`
- stores lifecycle status: searching, accepted, arrived, in_progress, completed, cancelled
- feeds dispatch, timeline, pricing, analytics

### `public.order_offers`
Driver offer queue.
Why needed:
- dispatch sends the same order to candidate drivers
- drivers accept/reject/expire the offer
- avoids assigning the same ride blindly

### `public.order_events`
Ride timeline / audit log.
Why needed:
- realtime client timeline
- debugging and fraud audit
- order status history

### `public.drivers`
Online driver registry.
Why needed:
- driver availability
- service type filtering
- geo search / dispatch

### `public.driver_earnings`
Driver payout ledger.
Why needed:
- completed ride revenue tracking
- future wallet / payout settlement

### `public.driver_ratings`
Driver quality and reputation.
Why needed:
- smart dispatch weighting
- admin moderation

### `public.dispatch_metrics`
Dispatch monitoring.
Why needed:
- acceptance rate
- retry diagnostics
- admin analytics

### `public.platform_metrics`
Platform telemetry.
Why needed:
- orders per minute
- error rate
- online drivers count

### `public.sos_alerts`
Safety alerts.
Why needed:
- SOS / panic flow
- incident trail

### `public.driver_location_stream`
Realtime driver coordinates stream.
Why needed:
- live tracking on map
- ETA / route refresh

## 2. Main mismatch found in the project

The uploaded code currently writes these columns into `public.orders`:
- `car_type`
- `comment`
- `distance_m`
- `duration_s`
- `surge_multiplier`
- `options`

But the base schema in `01_unigo_superapp_schema.sql` does not define all of them. That is why Supabase returns schema-cache errors.

## 3. Fix included in this patch

This patch adds a new migration:
- `sql/16_city_taxi_compat_patch.sql`

It adds compatibility columns required by the current taxi order flow:
- `car_type`
- `comment`
- `distance_m`
- `duration_s`
- `surge_multiplier`
- `options`
- `pickup_lat`
- `pickup_lng`
- `dropoff_lat`
- `dropoff_lng`

It also adds a trigger that keeps denormalized compatibility columns in sync with the unified `pickup` / `dropoff` jsonb fields.

## 4. Code fixes included in this patch

### `src/features/client/taxi/lib/taxiOrderAdapter.js`
Changed default `service_type` from `city_taxi` to `taxi` so it matches the existing schema constraint.

### `server/api/order.js`
Changed default `service_type` from `city_taxi` to `taxi` for the same reason.

## 5. What you should run now

After applying the patch files, run this SQL file in Supabase SQL Editor:

`sql/16_city_taxi_compat_patch.sql`

That will stop the repeated errors for missing columns in `orders`.

## 6. Why this is the correct production path

This keeps your architecture clean:
- `pickup` / `dropoff` jsonb remain the source of truth
- compatibility columns exist for the current frontend
- you do not need to rewrite the full taxi UI immediately
- dispatch / timeline / pricing keep working
