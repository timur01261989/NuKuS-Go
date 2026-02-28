// src/features/client/taxi/constants/tariffs.js
// Tariflar: Start, Komfort, Biznes
export const TARIFFS = [
      { id: "start", title: "Start", mult: 1, base: 4500, perKm: 1400 },
      { id: "comfort", title: "Komfort", mult: 1.2, base: 6500, perKm: 1700 },
      { id: "business", title: "Biznes", mult: 1.5, base: 9000, perKm: 2200 },
    ],
    [];

// Default tanlov (birinchi element)
export const DEFAULT_TARIFF = TARIFFS[0] || { key: "start", name: "Start", base: 0, perKm: 0, mult: 1 };
