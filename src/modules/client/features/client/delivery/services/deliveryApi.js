import { nominatimReverse as _nominatimReverse } from "../../shared/geo/nominatim";
// deliveryApi.js — frontend API
import api from "@/modules/shared/utils/apiHelper";

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
  // Preserve previous behavior: let network/JSON errors bubble up (no swallowing)
  return _nominatimReverse(lat, lng, { signal, swallowErrors: false });
}

