/**
 * Supabase `.select()` uchun aniq ustun ro‘yxatlari.
 * Manba: infrastructure/db/postgres/migrations/supabase/00_unigo_unified_id_full_schema.sql
 * (qisman keyingi migratsiyalar: interprov parcel/booked)
 */
export { ORDER_SELECT } from "../api/order.shared.js";

/** Status o‘tkazish / dispatch uchun orders jadvalidagi barcha API kerakli ustunlar ORDER_SELECT bilan qoplanadi */

/** Viloyatlararo reyslar ro‘yxati (list_offers, trip_search) */
export const INTERPROV_TRIP_LIST_COLUMNS = [
  "id",
  "user_id",
  "from_region",
  "to_region",
  "from_district",
  "to_district",
  "depart_at",
  "seat_price_uzs",
  "seats_total",
  "seats_available",
  "status",
  "created_at",
  "updated_at",
  "is_airport_transfer",
  "flight_number",
  "arrival_time",
  "terminal",
  "waiting_policy",
  "amenities",
  "child_seat_types",
  "wheelchair_accessible",
  "meet_greet",
  "parcel_enabled",
  "booked_seats",
].join(",");

export const INTERPROV_SEAT_REQUEST_COLUMNS = [
  "id",
  "trip_id",
  "user_id",
  "seats",
  "notes",
  "hold_id",
  "status",
  "created_at",
  "updated_at",
].join(",");

export const DISPATCH_DEMAND_PREDICTION_COLUMNS = [
  "id",
  "service_type",
  "region_key",
  "predicted_orders",
  "predicted_drivers_needed",
  "confidence",
  "prediction_window_minutes",
  "source",
  "created_at",
].join(",");

export const OBSERVABILITY_METRIC_COLUMNS = [
  "id",
  "metric_name",
  "metric_value",
  "labels",
  "created_at",
].join(",");

/** Unified sxemadagi push_tokens (token ustuni) */
export const PUSH_TOKEN_ROW_COLUMNS = [
  "id",
  "user_id",
  "token",
  "platform",
  "device_id",
  "role",
  "app_version",
  "is_active",
  "created_at",
  "updated_at",
].join(",");
