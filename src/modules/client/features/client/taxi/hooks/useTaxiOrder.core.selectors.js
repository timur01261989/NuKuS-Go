import { haversineKm } from "../../shared/geo/haversine";

export function getSavedAddressByLabel(list, label) {
  return Array.isArray(list)
    ? list.find((x) => String(x?.label || '').toLowerCase() === String(label || '').toLowerCase()) || null
    : null;
}

export function getDistanceKm(routeDistanceKm, pickupLatLng, destLatLng) {
  return routeDistanceKm || (pickupLatLng && destLatLng ? haversineKm(pickupLatLng, destLatLng) : 0);
}

export function getDurationMin(routeDurationMin, distanceKm) {
  return routeDurationMin || (distanceKm ? distanceKm * 2 : 0);
}

export function getTotalPrice(distanceKm, tariff) {
  const d = distanceKm || 0;
  const p = (tariff.base + d * tariff.perKm) * (tariff.mult || 1);
  return Math.round(p);
}

export function getVisibleSearchResults(destSearchText, destResults, pickupResults) {
  const qDest = String(destSearchText || '').trim();
  return qDest ? destResults : pickupResults;
}
