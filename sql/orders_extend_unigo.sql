-- sql/orders_extend_unigo.sql
-- SAFE additive schema extensions for UniGo (Stage infra)
-- Do NOT break existing queries: only ADD COLUMN IF NOT EXISTS and CREATE TABLE IF NOT EXISTS.

begin;

-- Orders: add service_type/payload & routing fields (nullable)
alter table if exists public.orders
  add column if not exists service_type text;

alter table if exists public.orders
  add column if not exists service_payload jsonb;

alter table if exists public.orders
  add column if not exists pickup_mode text;

alter table if exists public.orders
  add column if not exists seats_requested int;

alter table if exists public.orders
  add column if not exists gender_pref text;

alter table if exists public.orders
  add column if not exists distance_km numeric;

alter table if exists public.orders
  add column if not exists duration_min numeric;

alter table if exists public.orders
  add column if not exists route_summary jsonb;

alter table if exists public.orders
  add column if not exists payment_method text;

alter table if exists public.orders
  add column if not exists use_wallet boolean;

-- Offers: keep service_type alignment if needed
alter table if exists public.order_offers
  add column if not exists service_type text;

commit;
