import { freightApi } from "@/services/freightService";
import { nominatimReverse as _nominatimReverse } from "../../shared/geo/nominatim";

// NEW: Cargo marketplace freight (client)

export async function createCargo(payload) {
  return freightApi.createCargo(payload);
}

export async function cancelCargo({ cargoId, actorId }) {
  return freightApi.cancelCargo({ cargoId, actorId });
}

export async function cargoStatus({ cargoId }) {
  return freightApi.cargoStatus({ cargoId });
}

export async function matchVehicles({ cargoId, radiusKm = 30 }) {
  return freightApi.matchVehicles({ cargoId, radiusKm });
}

export async function listOffers({ cargoId }) {
  return freightApi.listOffers({ cargoId });
}

export async function acceptOffer({ cargoId, offerId, ownerId }) {
  return freightApi.acceptOffer({ cargoId, offerId, ownerId });
}

export async function nominatimReverse(lat, lng, signal) {
  // Preserve previous behavior: let errors bubble up
  return _nominatimReverse(lat, lng, { signal, swallowErrors: false });
}
