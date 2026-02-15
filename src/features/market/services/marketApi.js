
import api from "../../../apiHelper";

/**
 * Market API wrapper.
 * Backend bo'lmasa ham UI ishlashi uchun fallback (local mock) bor.
 */
const LS_KEY = "market_mock_ads_v1";
const LS_FAV = "market_fav_v1";
const LS_MY = "market_my_ads_v1";

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function seedMock() {
  const exists = load(LS_KEY, null);
  if (exists && Array.isArray(exists) && exists.length) return;

  const now = Date.now();
  const brands = ["Chevrolet", "KIA", "Hyundai", "Toyota", "Daewoo", "Mercedes", "BMW"];
  const models = ["Cobalt", "Nexia 3", "Gentra", "Spark", "Malibu", "Sonata", "Camry", "Rio", "Lacetti"];
  const cities = ["Nukus", "Toshkent", "Samarqand", "Buxoro", "Andijon", "Urganch", "Qarshi"];
  const photos = [
    "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=60",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=60",
    "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=60",
    "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=1200&q=60"
  ];

  const ads = Array.from({ length: 48 }).map((_, i) => {
    const brand = brands[i % brands.length];
    const model = models[i % models.length];
    const year = 2010 + (i % 14);
    const price = 3500 + (i % 20) * 250; // $ (shunchaki demo)
    const city = cities[i % cities.length];
    const mileage = 40_000 + (i % 15) * 12_000;
    const id = String(1000 + i);
    return {
      id,
      title: `${brand} ${model} ${year}`,
      brand,
      model,
      year,
      city,
      mileage,
      price,
      currency: "$",
      photos: [photos[i % photos.length]],
      createdAt: now - i * 3600_000,
      seller: { name: "Sotuvchi", phone: "+998900000000" },
      description: "Zo'r holat, hujjatlari joyida. Demo e'lon.",
      fuel: ["benzin", "gaz", "gibrid"][i % 3],
      transmission: ["avtomat", "mexanika"][i % 2],
      color: ["oq", "qora", "kulrang", "ko'k"][i % 4],
      exchange: i % 4 === 0,
      kredit: i % 5 === 0,
    };
  });
  save(LS_KEY, ads);
  save(LS_MY, [ads[0].id, ads[1].id]);
  save(LS_FAV, [ads[2].id, ads[3].id]);
}

seedMock();

function applyFilterSort(all, filterState = {}) {
  const {
    q,
    city,
    brand,
    minPrice,
    maxPrice,
    yearFrom,
    yearTo,
    exchange,
    kredit,
    sort,
  } = filterState;

  let list = [...all];

  if (q) {
    const s = String(q).toLowerCase();
    list = list.filter((a) => (a.title || "").toLowerCase().includes(s));
  }
  if (city) list = list.filter((a) => a.city === city);
  if (brand) list = list.filter((a) => a.brand === brand);

  const minP = Number.isFinite(Number(minPrice)) ? Number(minPrice) : null;
  const maxP = Number.isFinite(Number(maxPrice)) ? Number(maxPrice) : null;
  if (minP != null) list = list.filter((a) => (a.price ?? 0) >= minP);
  if (maxP != null) list = list.filter((a) => (a.price ?? 0) <= maxP);

  const yFrom = Number.isFinite(Number(yearFrom)) ? Number(yearFrom) : null;
  const yTo = Number.isFinite(Number(yearTo)) ? Number(yearTo) : null;
  if (yFrom != null) list = list.filter((a) => (a.year ?? 0) >= yFrom);
  if (yTo != null) list = list.filter((a) => (a.year ?? 9999) <= yTo);

  if (exchange) list = list.filter((a) => !!a.exchange);
  if (kredit) list = list.filter((a) => !!a.kredit);

  switch (sort) {
    case "price_asc":
      list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      break;
    case "price_desc":
      list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      break;
    case "year_desc":
      list.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
      break;
    default:
      list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }
  return list;
}

export async function listAds({ page = 1, pageSize = 12, filters = {} } = {}) {
  // try backend
  try {
    const res = await api.post("/api/market", { action: "list", page, pageSize, filters });
    const data = res?.data ?? res;
    if (data?.items) return data;
  } catch {
    // ignore
  }

  // fallback
  const all = load(LS_KEY, []);
  const filtered = applyFilterSort(all, filters);
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);
  return { items, total: filtered.length, page, pageSize };
}

export async function getAdDetails(id) {
  try {
    const res = await api.post("/api/market", { action: "details", id });
    const data = res?.data ?? res;
    if (data?.id) return data;
  } catch {}

  const all = load(LS_KEY, []);
  return all.find((x) => String(x.id) === String(id)) || null;
}

export async function toggleFavorite(adId) {
  try {
    const res = await api.post("/api/market", { action: "toggle_favorite", id: adId });
    const data = res?.data ?? res;
    if (typeof data?.isFav === "boolean") return data.isFav;
  } catch {}

  const fav = new Set(load(LS_FAV, []));
  const id = String(adId);
  if (fav.has(id)) fav.delete(id);
  else fav.add(id);
  const arr = Array.from(fav);
  save(LS_FAV, arr);
  return fav.has(id);
}

export function getFavorites() {
  const fav = new Set(load(LS_FAV, []));
  const all = load(LS_KEY, []);
  return all.filter((x) => fav.has(String(x.id)));
}

export function getMyAds() {
  const my = new Set(load(LS_MY, []));
  const all = load(LS_KEY, []);
  return all.filter((x) => my.has(String(x.id)));
}

export async function createAd(payload) {
  try {
    const res = await api.post("/api/market", { action: "create", ...payload });
    const data = res?.data ?? res;
    if (data?.id) return data;
  } catch {}

  const all = load(LS_KEY, []);
  const id = String(Date.now());
  const newAd = {
    id,
    title: payload?.title || "Yangi e'lon",
    brand: payload?.brand || "",
    model: payload?.model || "",
    year: Number(payload?.year) || new Date().getFullYear(),
    city: payload?.city || "Nukus",
    mileage: Number(payload?.mileage) || 0,
    price: Number(payload?.price) || 0,
    currency: payload?.currency || "$",
    photos: payload?.photos?.length ? payload.photos : [],
    createdAt: Date.now(),
    seller: { name: payload?.sellerName || "Sotuvchi", phone: payload?.sellerPhone || "" },
    description: payload?.description || "",
    fuel: payload?.fuel || "",
    transmission: payload?.transmission || "",
    color: payload?.color || "",
    exchange: !!payload?.exchange,
    kredit: !!payload?.kredit,
  };
  save(LS_KEY, [newAd, ...all]);

  const my = new Set(load(LS_MY, []));
  my.add(id);
  save(LS_MY, Array.from(my));
  return newAd;
}

// Simple image upload mock: returns same url/base64
export async function uploadImages(files = []) {
  try {
    const res = await api.post("/api/market", { action: "upload_images", files });
    const data = res?.data ?? res;
    if (Array.isArray(data?.urls)) return data.urls;
  } catch {}
  // fallback: create local object urls
  const urls = [];
  for (const f of files) {
    try {
      urls.push(URL.createObjectURL(f));
    } catch {}
  }
  return urls;
}
