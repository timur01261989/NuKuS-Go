/**
 * districtData.js
 * -------------------------------------------------------
 * Tumanlar koordinatalari (lat/lng) va narx modeli.
 *
 * ⚠️ Narxlar hozir masofa (km) asosida avtomatik hisoblanadi.
 * Keyin siz real tariflarni oson almashtirasiz:
 * - district.priceOverride (aniq narx)
 * yoki
 * - estimateDistrictPrice() formulasini o‘zgartirasiz.
 */

import { haversineKm } from "../../shared/geo/haversine";

// Backward-compat: some modules import { haversineKm } from this file.
// Keep the named export to avoid breaking existing imports.
export { haversineKm };

export const DISTRICTS = [
  // Karakalpakstan (approx coords)
  { id: "nukus", name: "Nukus", lat: 42.4617, lng: 59.6166 },
  { id: "khodjeyli", name: "Xo'jayli", lat: 42.4042, lng: 59.4403 },
  { id: "konirat", name: "Qo'ng'irot", lat: 43.0520, lng: 58.8530 },
  { id: "chimboy", name: "Chimboy", lat: 42.9410, lng: 59.7690 },
  { id: "turtkul", name: "To'rtko'l", lat: 41.5500, lng: 61.0167 },
  { id: "beruniy", name: "Beruniy", lat: 41.6917, lng: 60.7520 },
  { id: "amangeldi", name: "Amudaryo", lat: 42.0175, lng: 60.0010 },
];

export function findDistrictByName(name) {
  return DISTRICTS.find((d) => d.name.toLowerCase() === String(name || "").toLowerCase()) || null;
}


/**
 * Narx modeli:
 * - base = 7000 so'm (start)
 * - perKm = 1200 so'm
 * - min = 15000 so'm
 */
export function estimateDistrictPrice(distanceKm) {
  const km = Math.max(0, Number(distanceKm) || 0);
  const base = 7000;
  const perKm = 1200;
  const min = 15000;
  return Math.max(min, Math.round(base + km * perKm));
}