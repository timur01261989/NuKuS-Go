/**
 * Supabase .select() uchun aniq ro‘yxatlar — ortiqcha ustun va bandwidth yo‘q.
 */

/** Heartbeat / dispatch javobi */
export const DRIVER_PRESENCE_ROW = [
  "driver_id",
  "last_seen_at",
  "is_online",
  "state",
  "active_service_type",
  "updated_at",
  "lat",
  "lng",
  "speed",
  "bearing",
  "accuracy",
  "device_id",
  "platform",
  "app_version",
].join(",");

/** Ro‘yxat rejimi: karta / monitoring */
export const DRIVER_PRESENCE_LIST_MIN = [
  "driver_id",
  "last_seen_at",
  "is_online",
  "state",
  "active_service_type",
  "lat",
  "lng",
].join(",");

export const CLIENT_LAST_LOCATION_ROW = [
  "user_id",
  "lat",
  "lng",
  "accuracy_m",
  "updated_at",
].join(",");
