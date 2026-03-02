/**
 * freightApi.js (driver)
 * Freight API wrappers. Real implementation lives in src/services/freightService.js
 * Other services are untouched.
 */
import { freightApi } from "@/services/freightService";

export async function upsertVehicle(payload) {
  return freightApi.upsertVehicle(payload);
}

export async function setVehicleOnline(payload) {
  return freightApi.setVehicleOnline(payload);
}

export async function listVehicleCargo(payload) {
  return freightApi.listVehicleCargo(payload);
}

export async function createOffer(payload) {
  return freightApi.createOffer(payload);
}

export async function driverUpdateCargoStatus(payload) {
  return freightApi.driverUpdateCargoStatus(payload);
}

export async function quickOffer(payload) {
  return freightApi.quickOffer(payload);
}
