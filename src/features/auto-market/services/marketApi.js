/**
 * marketApi.js
 *
 * Bu faylni keyin Supabase bilan ulaysiz.
 * Hozircha mock implementatsiya (offline ishlashi uchun).
 */

const MOCK = Array.from({ length: 18 }).map((_, i) => ({
  id: String(1000 + i),
  brandId: i % 4 ? 1 : 2,
  modelId: 11,
  title: `Chevrolet Gentra ${2020 + (i % 5)}`,
  year: 2020 + (i % 5),
  mileage: 30000 + i * 1200,
  fuel: "Benzin",
  transmission: i % 2 ? "Avtomat" : "Mexanika",
  price: 120000000 + i * 2500000,
  currency: "UZS",
  images: ["https://placehold.co/800x600?text=Car+" + (i + 1)],
  location: { city: "Nukus", lat: 42.46, lng: 59.61 },
  status: i % 7 === 0 ? "top" : "new",
  is_top: i % 7 === 0,
  views: 20 + i,
  created_at: new Date(Date.now() - i * 3600 * 1000).toISOString(),
}));

/** List with simple filters/sort/pagination */
export async function listCars({ filters, page = 1, pageSize = 10 }) {
  await sleep(150);
  let items = [...MOCK];

  if (filters?.q) {
    const q = String(filters.q).toLowerCase();
    items = items.filter((x) => x.title.toLowerCase().includes(q));
  }
  if (filters?.brandId) items = items.filter((x) => x.brandId === filters.brandId);
  if (filters?.modelId) items = items.filter((x) => x.modelId === filters.modelId);
  if (filters?.city) items = items.filter((x) => x.location?.city === filters.city);

  switch (filters?.sort) {
    case "cheap":
      items.sort((a, b) => a.price - b.price);
      break;
    case "expensive":
      items.sort((a, b) => b.price - a.price);
      break;
    case "year_desc":
      items.sort((a, b) => (b.year || 0) - (a.year || 0));
      break;
    default:
      items.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  }

  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  return { items: slice, hasMore: start + pageSize < items.length };
}

export async function getCarById(id) {
  await sleep(120);
  const car = MOCK.find((x) => String(x.id) === String(id));
  if (!car) throw new Error("E'lon topilmadi");
  return car;
}

export async function createCarAd(draft) {
  await sleep(300);
  return { id: String(Date.now()), ...draft };
}

export async function listMyAds() {
  await sleep(150);
  return MOCK.slice(0, 6);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
