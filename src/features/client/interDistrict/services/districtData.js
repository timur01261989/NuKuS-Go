/**
 * districtData.js
 * -------------------------------------------------------
 * Hududlar (viloyatlar) va tumanlar koordinatalari (lat/lng).
 *
 * Muhim:
 * - Client tumanlar aro ishlashi uchun: region -> districtlar ro‘yxati kerak.
 * - Koordinatalar taxminiy (markaz nuqtalari). Keyin xohlasangiz to‘liq tuman ro‘yxatini to‘ldirasiz.
 */

import { haversineKm } from "../../shared/geo/haversine";

// Backward-compat: some modules import { haversineKm } from this file.
export { haversineKm };

/** Hududlar (viloyatlar) */
export const REGIONS = [
  { id: "karakalpakstan", name: "Qoraqalpog‘iston" },
  { id: "tashkent_city", name: "Toshkent shahri" },
  { id: "tashkent_region", name: "Toshkent viloyati" },
  { id: "andijan", name: "Andijon" },
  { id: "bukhara", name: "Buxoro" },
  { id: "fergana", name: "Farg‘ona" },
  { id: "jizzakh", name: "Jizzax" },
  { id: "khorezm", name: "Xorazm" },
  { id: "namangan", name: "Namangan" },
  { id: "navoiy", name: "Navoiy" },
  { id: "kashkadarya", name: "Qashqadaryo" },
  { id: "samarkand", name: "Samarqand" },
  { id: "sirdarya", name: "Sirdaryo" },
  { id: "surkhandarya", name: "Surxondaryo" },
];

/**
 * Minimal tumanlar ro‘yxati (ishlaydi).
 * Keyin siz har bir hududning barcha tumanlarini shu strukturaga to‘ldirib borasiz.
 */
export const DISTRICTS_BY_REGION = {
  karakalpakstan: [
    { id: "nukus", name: "Nukus", lat: 42.4617, lng: 59.6166 },
    { id: "khodjeyli", name: "Xo'jayli", lat: 42.4042, lng: 59.4403 },
    { id: "konirat", name: "Qo'ng'irot", lat: 43.0520, lng: 58.8530 },
    { id: "chimboy", name: "Chimboy", lat: 42.9410, lng: 59.7690 },
    { id: "turtkul", name: "To'rtko'l", lat: 41.5500, lng: 61.0167 },
    { id: "beruniy", name: "Beruniy", lat: 41.6917, lng: 60.7520 },
    { id: "amudaryo", name: "Amudaryo", lat: 42.0175, lng: 60.0010 },
  ],
  tashkent_city: [
    { id: "tashkent", name: "Toshkent", lat: 41.2995, lng: 69.2401 },
    { id: "chilonzor", name: "Chilonzor", lat: 41.2697, lng: 69.2041 },
    { id: "yunusobod", name: "Yunusobod", lat: 41.3670, lng: 69.2860 },
  ],
  tashkent_region: [
    { id: "chirchiq", name: "Chirchiq", lat: 41.4680, lng: 69.5820 },
    { id: "angren", name: "Angren", lat: 41.0167, lng: 70.1436 },
    { id: "olmalik", name: "Olmaliq", lat: 40.8440, lng: 69.5987 },
  ],
  andijan: [
    { id: "andijan_city", name: "Andijon", lat: 40.7821, lng: 72.3442 },
    { id: "asaka", name: "Asaka", lat: 40.6415, lng: 72.2396 },
    { id: "shahrixon", name: "Shahrixon", lat: 40.7133, lng: 72.0574 },
  ],
  bukhara: [
    { id: "bukhara_city", name: "Buxoro", lat: 39.7670, lng: 64.4230 },
    { id: "gijduvon", name: "G‘ijduvon", lat: 40.1000, lng: 64.6830 },
    { id: "karakul", name: "Qorako‘l", lat: 39.5333, lng: 63.8500 },
  ],
  fergana: [
    { id: "fergana_city", name: "Farg‘ona", lat: 40.3893, lng: 71.7876 },
    { id: "margilan", name: "Marg‘ilon", lat: 40.4724, lng: 71.7246 },
    { id: "quvasoy", name: "Quvasoy", lat: 40.2972, lng: 71.9794 },
  ],
  jizzakh: [
    { id: "jizzakh_city", name: "Jizzax", lat: 40.1158, lng: 67.8422 },
    { id: "dustlik", name: "Do‘stlik", lat: 40.5420, lng: 68.0430 },
    { id: "zomin", name: "Zomin", lat: 39.9600, lng: 68.3950 },
  ],
  khorezm: [
    { id: "urganch", name: "Urganch", lat: 41.5500, lng: 60.6333 },
    { id: "khiva", name: "Xiva", lat: 41.3890, lng: 60.3420 },
    { id: "hazorasp", name: "Hazorasp", lat: 41.3200, lng: 61.0750 },
  ],
  namangan: [
    { id: "namangan_city", name: "Namangan", lat: 40.9983, lng: 71.6726 },
    { id: "chortoq", name: "Chortoq", lat: 41.0670, lng: 71.8230 },
    { id: "chust", name: "Chust", lat: 41.0010, lng: 71.2380 },
  ],
  navoiy: [
    { id: "navoiy_city", name: "Navoiy", lat: 40.0844, lng: 65.3792 },
    { id: "zarafshon", name: "Zarafshon", lat: 41.5820, lng: 64.2100 },
    { id: "karmana", name: "Karmana", lat: 40.1360, lng: 65.3600 },
  ],
  kashkadarya: [
    { id: "qarshi", name: "Qarshi", lat: 38.8606, lng: 65.7847 },
    { id: "shahrisabz", name: "Shahrisabz", lat: 39.0578, lng: 66.8340 },
    { id: "guzar", name: "G‘uzor", lat: 38.6200, lng: 66.2500 },
  ],
  samarkand: [
    { id: "samarkand_city", name: "Samarqand", lat: 39.6542, lng: 66.9597 },
    { id: "urgut", name: "Urgut", lat: 39.4040, lng: 67.2430 },
    { id: "kattaqorgon", name: "Kattaqo‘rg‘on", lat: 39.8990, lng: 66.2580 },
  ],
  sirdarya: [
    { id: "guliston", name: "Guliston", lat: 40.4907, lng: 68.7842 },
    { id: "yangiyer", name: "Yangiyer", lat: 40.2730, lng: 68.8220 },
    { id: "sirdaryo", name: "Sirdaryo", lat: 40.8430, lng: 68.6610 },
  ],
  surkhandarya: [
    { id: "termiz", name: "Termiz", lat: 37.2242, lng: 67.2783 },
    { id: "denov", name: "Denov", lat: 38.2660, lng: 67.8980 },
    { id: "sherobod", name: "Sherobod", lat: 37.6620, lng: 67.0100 },
  ],
};

/** Flatten for backward compat */
export const DISTRICTS = Object.values(DISTRICTS_BY_REGION).flat();

export function getDistrictsByRegion(regionId) {
  return DISTRICTS_BY_REGION[regionId] || [];
}

export function findDistrict(regionId, districtName) {
  const list = regionId ? getDistrictsByRegion(regionId) : DISTRICTS;
  return (
    list.find((d) => d.name.toLowerCase() === String(districtName || "").toLowerCase()) ||
    null
  );
}

/** Backward-compat */
export function findDistrictByName(name) {
  return findDistrict(null, name);
}

/**
 * Narx modeli (fallback):
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
