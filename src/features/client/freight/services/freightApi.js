import api from "@/utils/apiHelper";
import { nominatimReverse as _nominatimReverse } from "../../shared/geo/nominatim";

// NEW: Cargo marketplace freight
export async function createCargo(payload) {
  return api.post("/api/freight", { action: "create_cargo", ...payload });
}

export async function cancelCargo({ cargoId, actorId }) {
  return api.post("/api/freight", { action: "cancel_cargo", cargoId, actorId });
}

export async function cargoStatus({ cargoId }) {
  return api.post("/api/freight", { action: "cargo_status", cargoId });
}

export async function matchVehicles({ cargoId, radiusKm = 30 }) {
  return api.post("/api/freight", { action: "match_vehicles", cargoId, radiusKm });
}

export async function listOffers({ cargoId }) {
  return api.post("/api/freight", { action: "list_offers", cargoId });
}

export async function acceptOffer({ cargoId, offerId, ownerId }) {
  return api.post("/api/freight", { action: "accept_offer", cargoId, offerId, ownerId });
}

export async function nominatimReverse(lat, lng, signal) {
  // Preserve previous behavior: let errors bubble up
  return _nominatimReverse(lat, lng, { signal, swallowErrors: false });
}

