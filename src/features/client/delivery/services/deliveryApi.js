// deliveryApi.js — frontend API
import api from "@/utils/apiHelper";

/**
 * Actions (backendga moslab o'zgartirasiz):
 * - create_delivery
 * - delivery_status
 * - cancel_delivery
 * - update_delivery_status
 * - active_delivery
 */
export const deliveryApi = {
  create: (payload) => api.post("/api/delivery", { action: "create_delivery", ...payload }),
  status: (orderId) => api.post("/api/delivery", { action: "delivery_status", orderId }),
  cancel: (orderId) => api.post("/api/delivery", { action: "cancel_delivery", orderId }),
  updateStatus: (orderId, status, extra = {}) =>
    api.post("/api/delivery", { action: "update_delivery_status", orderId, status, ...extra }),
  active: () => api.post("/api/delivery", { action: "active_delivery" }),
};

// Reverse geocode (Nominatim)
export async function nominatimReverse(lat, lng, signal) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&addressdetails=1&lat=${encodeURIComponent(
    lat
  )}&lon=${encodeURIComponent(lng)}`;
  const res = await fetch(url, { signal, headers: { "Accept-Language": "uz,ru,en" } });
  const data = await res.json();
  return data?.display_name || "";
}
