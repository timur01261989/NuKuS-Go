/**
 * src/services/freightService.js
 * UniGo Freight (Yuk tashish) service layer.
 *
 * Maqsad:
 *  - Freight logikasini bitta joyga jamlash (API + Supabase Realtime + RPC helpers).
 *  - Loyiha ichidagi boshqa xizmatlarga TEGILMAYDI.
 *
 * Ishlatadi:
 *  - Vercel API: /api/freight (server/api/freight.js)
 *  - Supabase Realtime (publication: supabase_realtime) — siz yoqib bo‘lgansiz.
 *  - RPC (ixtiyoriy, lekin tavsiya):
 *      - match_vehicles_for_cargo(p_cargo_id uuid, p_radius_km int)
 *      - increment_cargo_views(p_cargo_id uuid)
 *      - increment_cargo_offers(p_cargo_id uuid)
 *      - mark_driver_heartbeat(p_vehicle_id uuid, p_lng numeric, p_lat numeric)
 *      - calculate_quick_offer_price(p_distance_km numeric, p_weight_kg int)  (ixtiyoriy)
 */

import api from "@/utils/apiHelper";
import { supabase } from "@/lib/supabase";

/** ---------- utils ---------- */
function noop() {}

function debounce(fn, ms = 400) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function safeNumber(x, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

/** ---------- API wrappers (server/api/freight.js) ----------
 * Eslatma: bu endpointlar sizda freight uchun alohida yozilgan.
 * Biz faqat freight ichida ishlatamiz.
 */
export const freightApi = {
  // Client
  createCargo: (payload) => api.post("/api/freight", { action: "create_cargo", ...payload }),
  cancelCargo: ({ cargoId, actorId }) => api.post("/api/freight", { action: "cancel_cargo", cargoId, actorId }),
  cargoStatus: ({ cargoId }) => api.post("/api/freight", { action: "cargo_status", cargoId }),
  matchVehicles: ({ cargoId, radiusKm = 30 }) => api.post("/api/freight", { action: "match_vehicles", cargoId, radiusKm }),
  listOffers: ({ cargoId }) => api.post("/api/freight", { action: "list_offers", cargoId }),
  acceptOffer: ({ cargoId, offerId, ownerId }) =>
    api.post("/api/freight", { action: "accept_offer", cargoId, offerId, ownerId }),

  // Driver
  upsertVehicle: (payload) => api.post("/api/freight", { action: "upsert_vehicle", ...payload }),
  setVehicleOnline: (payload) => api.post("/api/freight", { action: "set_vehicle_online", ...payload }),
  listVehicleCargo: (payload) => api.post("/api/freight", { action: "list_vehicle_cargo", ...payload }),
  createOffer: (payload) => api.post("/api/freight", { action: "create_offer", ...payload }),
  driverUpdateCargoStatus: (payload) => api.post("/api/freight", { action: "driver_update_status", ...payload }),
  quickOffer: (payload) => api.post("/api/freight", { action: "quick_offer", ...payload }),
};

/** ---------- RPC helpers (Supabase) ----------
 * Bu funksiyalar DB’da bo‘lsa ishlaydi, bo‘lmasa error qaytaradi — biz esa fallback qilamiz.
 */
export async function matchVehiclesRpc({ cargoId, radiusKm = 30 }) {
  const { data, error } = await supabase.rpc("match_vehicles_for_cargo", {
    p_cargo_id: cargoId,
    p_radius_km: radiusKm,
  });
  if (error) throw error;
  return data ?? [];
}

export async function incrementCargoViews(cargoId) {
  if (!cargoId) return;
  try {
    const { error } = await supabase.rpc("increment_cargo_views", { p_cargo_id: cargoId });
    if (error) throw error;
  } catch {
    // fallback: jim (bu counter bo‘lmasa ham core ishlaydi)
  }
}

export async function incrementCargoOffers(cargoId) {
  if (!cargoId) return;
  try {
    const { error } = await supabase.rpc("increment_cargo_offers", { p_cargo_id: cargoId });
    if (error) throw error;
  } catch {
    // fallback: jim
  }
}

/** Quick Offer pricing: DB RPC bo‘lsa o‘sha, bo‘lmasa local formula */
export async function calculateQuickOfferPrice({ distanceKm, weightKg }) {
  const d = safeNumber(distanceKm, 0);
  const w = safeNumber(weightKg, 0);

  // 1) try DB RPC
  try {
    const { data, error } = await supabase.rpc("calculate_quick_offer_price", {
      p_distance_km: d,
      p_weight_kg: w,
    });
    if (!error && data != null) return Number(data);
  } catch {
    // ignore
  }

  // 2) fallback: global config (optional)
  let baseFee = 30000;
  let perKm = 4000;
  let perTon = 15000;

  try {
    const { data } = await supabase.from("app_config").select("base_fee,per_km,per_ton").eq("scope", "global").limit(1);
    const row = data?.[0];
    if (row) {
      baseFee = safeNumber(row.base_fee, baseFee);
      perKm = safeNumber(row.per_km, perKm);
      perTon = safeNumber(row.per_ton, perTon);
    }
  } catch {
    // ignore
  }

  return baseFee + d * perKm + (w / 1000) * perTon;
}

/** ---------- Heartbeat (driver activity) ----------
 * Marketplace "tirik" ko‘rinishi uchun driver online payti joylashuv yangilanib turishi kerak.
 * startDriverHeartbeat(...) driver sahifasida ishlatiladi.
 */
export function startDriverHeartbeat({
  vehicleId,
  getPosition, // async () => ({ lng, lat })  OR sync returning same
  intervalMs = 20000,
  onError,
}) {
  let timer = null;
  let stopped = false;

  async function tick() {
    if (stopped) return;
    try {
      const pos = await (typeof getPosition === "function" ? getPosition() : null);
      if (!pos || !Number.isFinite(pos.lng) || !Number.isFinite(pos.lat)) return;

      // RPC bo‘lsa — eng to‘g‘ri yo‘l
      try {
        const { error } = await supabase.rpc("mark_driver_heartbeat", {
          p_vehicle_id: vehicleId,
          p_lng: pos.lng,
          p_lat: pos.lat,
        });
        if (error) throw error;
        return;
      } catch {
        // fallback: API orqali online set (agar backend shuni qo‘llasa)
        try {
          await freightApi.setVehicleOnline({ vehicleId, isOnline: true, lng: pos.lng, lat: pos.lat });
        } catch (e) {
          throw e;
        }
      }
    } catch (e) {
      if (typeof onError === "function") onError(e);
    }
  }

  timer = setInterval(tick, intervalMs);
  // immediate tick
  tick();

  return () => {
    stopped = true;
    if (timer) clearInterval(timer);
  };
}

/** ---------- Realtime subscriptions ----------
 * Qoidasi:
 *  - event keldi -> onChange() (siz ichida refetch qilasiz)
 *  - debounce: UI spam bo‘lmasin
 */
export function subscribeClientCargo({ cargoId, onChange }) {
  if (!cargoId) return noop;
  const refresh = typeof onChange === "function" ? debounce(onChange, 350) : noop;

  const ch = supabase
    .channel(`unigo_freight_client_${cargoId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "cargo_orders", filter: `id=eq.${cargoId}` }, refresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "cargo_offers", filter: `cargo_id=eq.${cargoId}` }, refresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "cargo_status_events", filter: `cargo_id=eq.${cargoId}` }, refresh)
    .subscribe();

  return () => {
    try {
      supabase.removeChannel(ch);
    } catch {}
  };
}

export function subscribeDriverFreight({ vehicleId, onChange }) {
  if (!vehicleId) return noop;
  const refresh = typeof onChange === "function" ? debounce(onChange, 450) : noop;

  const ch = supabase
    .channel(`unigo_freight_driver_${vehicleId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "cargo_orders" }, refresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "cargo_offers" }, refresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "vehicles", filter: `id=eq.${vehicleId}` }, refresh)
    .subscribe();

  return () => {
    try {
      supabase.removeChannel(ch);
    } catch {}
  };
}

/** ---------- Vehicle type mapping ----------
 * UI labels -> DB enum values (Sizning enumingiz: van, gazelle, box, refrigerated, flatbed, truck_5t, truck_10t, fura, other)
 * UI’da siz so‘ragan nomlar qoladi, DB’ga shu qiymatlar ketadi.
 */
export const vehicleTypeMap = {
  "Matiz / Labo / Damas": "van",
  "Gazel / Porter": "gazelle",
  "Isuzu / Kamaz": "truck_5t",
  Fura: "fura",
};
