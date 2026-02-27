/**
 * freightApi.js
 * Server bilan aloqa. Sizning loyihangizda `src/utils/apiHelper.js` bor.
 * Shu helper bilan bir xil uslubda ishlatamiz.
 */
import api from "@/utils/apiHelper";

/**
 * Haydovchiga mos buyurtmalarni olish
 * @param {object} params
 */
export async function listFreightOrders(params) {
  return api.post("/api/freight", { action: "list", ...params });
}

export async function setFreightOnline(payload) {
  return api.post("/api/freight", { action: "set_online", ...payload });
}

export async function bidOnOrder(payload) {
  return api.post("/api/freight", { action: "bid", ...payload });
}

export async function acceptOrder(payload) {
  return api.post("/api/freight", { action: "accept", ...payload });
}

export async function updateFreightStatus(payload) {
  return api.post("/api/freight", { action: "update_status", ...payload });
}
