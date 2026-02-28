// src/features/client/taxi/constants/tariffs.js
// Tariflar: Start, Komfort, Biznes

export const TARIFFS = [
  { id: "start", title: "Start", mult: 1, base: 4500, perKm: 1400 },
  { id: "comfort", title: "Komfort", mult: 1.2, base: 6500, perKm: 1800 },
  { id: "business", title: "Biznes", mult: 1.6, base: 9500, perKm: 2500 },
];

export const DEFAULT_TARIFF = TARIFFS[0];
