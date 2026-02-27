// truckData.js — mashina turlari va tariflari (misol)

export const TRUCKS = [
  {
    id: "labo",
    title: "Labo / Damas",
    subtitle: "Kichik yuklar, maishiy texnika",
    sizeLabel: "Kichik",
    capacity: "≈ 450–650 kg",
    basePrice: 25000,
    perKm: 3500,
    icon: "🚚",
  },
  {
    id: "gazel",
    title: "Gazel / Porter",
    subtitle: "Uy ko‘chirish, mebel",
    sizeLabel: "O‘rta",
    capacity: "≈ 1.5–2 tonna",
    basePrice: 45000,
    perKm: 5500,
    icon: "🚛",
  },
  {
    id: "isuzu",
    title: "Isuzu / Kamaz",
    subtitle: "Qurilish mollari",
    sizeLabel: "Katta",
    capacity: "≈ 3–10 tonna",
    basePrice: 80000,
    perKm: 8500,
    icon: "🚚",
  },
];

export const LOADERS_FEE_EACH = 50000;

export function formatUZS(x) {
  const n = Math.round(Number(x) || 0);
  return n.toLocaleString("uz-UZ") + " so'm";
}
