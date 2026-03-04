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


/**
 * Multi-region support (Hudud -> Tumanlar)
 * -------------------------------------------------------
 * Siz keyin bu ro'yxatni to'liq (hamma tumanlar) qilib kengaytirasiz.
 * Hozir minimal ishlaydigan struktura berilgan:
 * - REGIONS: hududlar ro'yxati
 * - districtsByRegion: har bir hudud uchun tumanlar ro'yxati (string)
 */
export const REGIONS = [
  "Qoraqalpogʻiston",
  "Toshkent shahri",
  "Toshkent viloyati",
  "Andijon",
  "Buxoro",
  "Fargʻona",
  "Jizzax",
  "Xorazm",
  "Namangan",
  "Navoiy",
  "Qashqadaryo",
  "Samarqand",
  "Sirdaryo",
  "Surxondaryo",
];

export const districtsByRegion = {
  "Qoraqalpogʻiston": ["Nukus", "Xo'jayli", "Qo'ng'irot", "Chimboy", "To'rtko'l", "Beruniy", "Amudaryo"],
  "Toshkent shahri": ["Toshkent"],
  "Toshkent viloyati": ["Chirchiq", "Angren", "Bekobod", "Olmaliq", "Yangiyo‘l"],
  "Andijon": ["Andijon", "Asaka", "Shahrixon", "Xo'jaobod"],
  "Buxoro": ["Buxoro", "G'ijduvon", "Kogon", "Qorako‘l"],
  "Fargʻona": ["Fargʻona", "Margʻilon", "Qo'qon", "Rishton"],
  "Jizzax": ["Jizzax", "Zomin", "G'allaorol", "Paxtakor"],
  "Xorazm": ["Urganch", "Xiva", "Hazorasp", "Shovot"],
  "Namangan": ["Namangan", "Chust", "Pop", "Kosonsoy"],
  "Navoiy": ["Navoiy", "Zarafshon", "Karmana", "Konimex"],
  "Qashqadaryo": ["Qarshi", "Shahrisabz", "Kitob", "G'uzor"],
  "Samarqand": ["Samarqand", "Kattaqo'rg'on", "Urgut", "Ishtixon"],
  "Sirdaryo": ["Guliston", "Yangiyer", "Shirin", "Boyovut"],
  "Surxondaryo": ["Termiz", "Denov", "Sherobod", "Boysun"],
};

export function getDistrictNamesByRegion(region) {
  if (!region) return [];
  return districtsByRegion[region] || [];
}

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