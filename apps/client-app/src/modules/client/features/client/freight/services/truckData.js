// truckData.js — mashina turlari va tariflari (misol)
// IMPORTANT: bodyType values must match DB enum vehicle_body_type.

export const TRUCKS = [
  {
    id: "motoruller",
    title: "Motoruller",
    subtitle: "Juda kichik yuklar",
    sizeLabel: "Juda kichik",
    capacity: "≈ 20–80 kg",
    basePrice: 15000,
    perKm: 2500,
    icon: "🛵",
    bodyType: "van", // mapped to existing enum
  },
  {
    id: "labo_damas",
    title: "Labo / Damas",
    subtitle: "Kichik yuklar, maishiy texnika",
    sizeLabel: "Kichik",
    capacity: "≈ 350–650 kg",
    basePrice: 25000,
    perKm: 3500,
    icon: "🚚",
    bodyType: "box",
  },
  {
    id: "gazel",
    title: "Gazel",
    subtitle: "Uy ko‘chirish, mebel",
    sizeLabel: "O‘rta",
    capacity: "≈ 1.5–2 tonna",
    basePrice: 45000,
    perKm: 5500,
    icon: "🚛",
    bodyType: "gazelle",
  },
  {
    id: "isuzu_kamaz",
    title: "Isuzu / Kamaz",
    subtitle: "Qurilish mollari, o‘rta-katta yuklar",
    sizeLabel: "Katta",
    capacity: "≈ 5–10 tonna",
    basePrice: 80000,
    perKm: 8500,
    icon: "🚚",
    bodyType: "truck_10t",
  },
  {
    id: "fura",
    title: "Fura",
    subtitle: "Uzoq masofa, katta yuklar",
    sizeLabel: "Juda katta",
    capacity: "≈ 20+ tonna",
    basePrice: 140000,
    perKm: 12000,
    icon: "🚛",
    bodyType: "fura",
  },
];

export const LOADERS_FEE_EACH = 50000;

export function formatUZS(x) {
  const n = Math.round(Number(x) || 0);
  return n.toLocaleString("uz-UZ") + " so'm";
}
