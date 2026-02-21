import api from "@/utils/apiHelper";
import { nominatimReverse as _nominatimReverse } from "../../shared/geo/nominatim";


export async function createFreightOrder(payload) {
  return api.post("/api/order", { action: "create_freight", ...payload });
}

export async function cancelFreightOrder(orderId) {
  return api.post("/api/order", { action: "cancel", orderId });
}

export async function freightStatus(orderId) {
  return api.post("/api/order", { action: "status", orderId });
}

export async function nominatimReverse(lat, lng, signal) {
  // Preserve previous behavior: let errors bubble up
  return _nominatimReverse(lat, lng, { signal, swallowErrors: false });
}

