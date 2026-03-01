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
export async function upsertVehicle(payload) {
  return api.post("/api/freight", { action: "upsert_vehicle", ...payload });
}

export async function setVehicleOnline(payload) {
  return api.post("/api/freight", { action: "set_vehicle_online", ...payload });
}

export async function listVehicleCargo(payload) {
  return api.post("/api/freight", { action: "list_vehicle_cargo", ...payload });
}

export async function createOffer(payload) {
  return api.post("/api/freight", { action: "create_offer", ...payload });
}

export async function driverUpdateCargoStatus(payload) {
  return api.post("/api/freight", { action: "driver_update_status", ...payload });
}
