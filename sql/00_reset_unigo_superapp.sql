-- WARNING:
-- Bu fayl eski UniGo / Nukus Go test schema'ni tozalash uchun.
-- Production bazada ishlatishdan oldin backup oling.

begin;

-- Triggers / functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.touch_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.apply_driver_permissions(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.accept_order_atomic(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.complete_order_atomic(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.sync_driver_presence_ids() CASCADE;
DROP FUNCTION IF EXISTS public.sync_order_offers_ids() CASCADE;
DROP FUNCTION IF EXISTS public.find_eligible_drivers(text, numeric, numeric, double precision, double precision, integer, uuid[]) CASCADE;
DROP FUNCTION IF EXISTS public.find_nearby_drivers(double precision, double precision, double precision, integer, uuid[]) CASCADE;

-- Tables (dependency order)
DROP TABLE IF EXISTS public.order_events CASCADE;
DROP TABLE IF EXISTS public.order_status_history CASCADE;
DROP TABLE IF EXISTS public.order_offers CASCADE;
DROP TABLE IF EXISTS public.billing_transactions CASCADE;
DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.driver_presence CASCADE;
DROP TABLE IF EXISTS public.drivers CASCADE;
DROP TABLE IF EXISTS public.driver_applications CASCADE;
DROP TABLE IF EXISTS public.auto_market_favorites CASCADE;
DROP TABLE IF EXISTS public.auto_market_images CASCADE;
DROP TABLE IF EXISTS public.auto_market_payments CASCADE;
DROP TABLE IF EXISTS public.auto_market_ads CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Optional old objects from previous builds
DROP TABLE IF EXISTS public.auto_ad_images CASCADE;
DROP TABLE IF EXISTS public.auto_favorites CASCADE;
DROP TABLE IF EXISTS public.auto_price_history CASCADE;
DROP TABLE IF EXISTS public.auto_garaj CASCADE;
DROP TABLE IF EXISTS public.auto_reports CASCADE;
DROP TABLE IF EXISTS public.cashback_records CASCADE;
DROP TABLE IF EXISTS public.promo_code_usage CASCADE;
DROP TABLE IF EXISTS public.promo_codes CASCADE;
DROP TABLE IF EXISTS public.payments_ledger_entries CASCADE;
DROP TABLE IF EXISTS public.payments_ledger_accounts CASCADE;
DROP TABLE IF EXISTS public.push_tokens CASCADE;
DROP TABLE IF EXISTS public.support_threads CASCADE;
DROP TABLE IF EXISTS public.support_messages CASCADE;
DROP TABLE IF EXISTS public.voip_call_logs CASCADE;
DROP TABLE IF EXISTS public.driver_metrics CASCADE;
DROP TABLE IF EXISTS public.api_rate_limits CASCADE;
DROP TABLE IF EXISTS public.analytics_events CASCADE;
DROP TABLE IF EXISTS public.idempotency_keys CASCADE;
DROP TABLE IF EXISTS public.job_queue CASCADE;
DROP TABLE IF EXISTS public.district_pitaks CASCADE;
DROP TABLE IF EXISTS public.interdistrict_trip_requests CASCADE;
DROP TABLE IF EXISTS public.delivery_orders CASCADE;

commit;
