/**
 * AUTO MARKET API (mock-first).
 * Keyin Supabase / backend ulash oson bo'lishi uchun bitta joyda.
 */
import { BRANDS, MODELS_BY_BRAND, CITIES, FUELS, TRANSMISSIONS, COLORS, BODY_TYPES, DRIVE_TYPES } from "./staticData";

const LS_ADS = "auto_market_ads_v1";
const LS_FAV = "auto_market_fav_v1";
const LS_MY = "auto_market_my_v1";
const LS_PRICE_HIST = "auto_market_price_hist_v1";

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function nowISO() { return new Date().toISOString(); }

function seed() {
  const existing = load(LS_ADS, null);
  if (Array.isArray(existing) && existing.length) return;

  const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const brand = () => randomFrom(BRANDS).name;
  const model = (b) => randomFrom(MODELS_BY_BRAND[b] || ["Model"]);

  const gen = (i) => {
    const b = brand();
    const m = model(b);
    const year = 2009 + (i % 15);
    const priceUZS = 45000000 + (i * 2500000);
    const city = randomFrom(CITIES);
    const isTop = i % 7 === 0;
    const kredit = i % 6 === 0;
    const exchange = i % 9 === 0;
    const fuel = randomFrom(FUELS);
    const transmission = randomFrom(TRANSMISSIONS);
    const color = randomFrom(COLORS);
    const body_type = randomFrom(BODY_TYPES);
    const drive_type = randomFrom(DRIVE_TYPES);
    const mileage = 30000 + i * 9500;

    const id = uid();
    const images = [
      `https://picsum.photos/seed/auto_${id}_1/900/650`,
      `https://picsum.photos/seed/auto_${id}_2/900/650`,
      `https://picsum.photos/seed/auto_${id}_3/900/650`,
    ];

    // price history
    const hist = [
      { t: Date.now() - 1000*60*60*24*30, p: priceUZS + 1500000 },
      { t: Date.now() - 1000*60*60*24*14, p: priceUZS + 500000 },
      { t: Date.now() - 1000*60*60*24*2, p: priceUZS },
    ];
    return {
      id,
      user_id: i % 5 === 0 ? "me" : `user_${i % 7}`,
      brand: b,
      model: m,
      year,
      mileage,
      price: priceUZS,
      currency: "UZS",
      city,
      location: { lat: 42.46 + (i%10)*0.01, lng: 59.61 + (i%10)*0.01, city },
      fuel_type: fuel,
      transmission,
      color,
      body_type,
      drive_type,
      engine: `${1.5 + (i%4)*0.2}L`,
      status: "active",
      is_top: isTop,
      views: Math.floor(Math.random()*2200),
      kredit,
      exchange,
      comfort: { ac: i%2===0, abs: i%3===0, sunroof: i%4===0, airbags: i%2===0 },
      description: "Holati a'lo. Hujjatlar joyida. Ko'rib kelish mumkin.",
      seller: { name: i%5===0 ? "Timur" : `Sotuvchi ${i}`, phone: "+998 90 000 00 00", rating: 4.6 + ((i%4)*0.1) },
      vin: i%8===0 ? "XTA00000000000000" : "",
      images,
      created_at: new Date(Date.now()-i*1000*60*60*10).toISOString(),
    };
  };

  const ads = Array.from({ length: 36 }, (_, i) => gen(i+1));
  save(LS_ADS, ads);

  const histMap = {};
  ads.forEach(a => {
    histMap[a.id] = [
      { at: new Date(Date.now()-1000*60*60*24*30).toISOString(), price: a.price + 1500000, currency: a.currency },
      { at: new Date(Date.now()-1000*60*60*24*14).toISOString(), price: a.price + 500000, currency: a.currency },
      { at: new Date(Date.now()-1000*60*60*24*2).toISOString(), price: a.price, currency: a.currency },
    ];
  });
  save(LS_PRICE_HIST, histMap);
}
seed();

// --- helpers
function applyFilters(list, f) {
  let out = [...list];
  const q = (f.q || "").trim().toLowerCase();
  if (q) {
    out = out.filter(a =>
      `${a.brand} ${a.model} ${a.city} ${a.year}`.toLowerCase().includes(q)
    );
  }
  if (f.city) out = out.filter(a => a.city === f.city);
  if (f.brand) out = out.filter(a => a.brand === f.brand);
  if (f.model) out = out.filter(a => a.model === f.model);
  if (f.yearFrom) out = out.filter(a => Number(a.year) >= Number(f.yearFrom));
  if (f.yearTo) out = out.filter(a => Number(a.year) <= Number(f.yearTo));
  if (f.minPrice) out = out.filter(a => Number(a.price) >= Number(f.minPrice));
  if (f.maxPrice) out = out.filter(a => Number(a.price) <= Number(f.maxPrice));
  if (f.kredit) out = out.filter(a => !!a.kredit);
  if (f.exchange) out = out.filter(a => !!a.exchange);

  // nearMe / radius (demo): center + haversine
  if (f.nearMe && f.center?.lat && f.center?.lng) {
    const R = Number(f.radiusKm || 10);
    const hav = (lat1, lon1, lat2, lon2) => {
      const toRad = d => d*Math.PI/180;
      const rr = 6371;
      const dLat = toRad(lat2-lat1);
      const dLon = toRad(lon2-lon1);
      const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
      return rr * (2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
    };
    out = out.filter(a => {
      const d = hav(f.center.lat, f.center.lng, a.location?.lat || 0, a.location?.lng || 0);
      return d <= R;
    });
  }

  // sort
  switch (f.sort) {
    case "cheap":
      out.sort((a,b)=>a.price-b.price); break;
    case "expensive":
      out.sort((a,b)=>b.price-a.price); break;
    case "year_new":
      out.sort((a,b)=>Number(b.year)-Number(a.year)); break;
    default:
      out.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  }
  return out;
}

// --- API
export async function listCars(filters = {}, { page = 1, pageSize = 12 } = {}) {
  const ads = load(LS_ADS, []);
  const filtered = applyFilters(ads, filters);
  const total = filtered.length;
  const start = (page-1)*pageSize;
  const items = filtered.slice(start, start + pageSize);
  return { items, total, page, pageSize };
}

export async function getCarById(id) {
  const ads = load(LS_ADS, []);
  const found = ads.find(a => String(a.id) === String(id));
  if (!found) throw new Error("E'lon topilmadi");
  // increment views
  found.views = (found.views || 0) + 1;
  save(LS_ADS, ads);
  return found;
}

export async function toggleFavorite(adId) {
  const fav = new Set(load(LS_FAV, []));
  const key = String(adId);
  if (fav.has(key)) fav.delete(key); else fav.add(key);
  save(LS_FAV, Array.from(fav));
  return Array.from(fav);
}

export async function getFavorites() {
  return new Set(load(LS_FAV, []));
}

export async function listFavoriteCars(filters = {}) {
  const fav = new Set(load(LS_FAV, []));
  const ads = load(LS_ADS, []).filter(a => fav.has(String(a.id)));
  return applyFilters(ads, filters);
}

export async function createCarAd(draft) {
  const ads = load(LS_ADS, []);
  const id = uid();
  const ad = {
    id,
    user_id: "me",
    ...draft,
    status: "active",
    is_top: !!draft.is_top,
    views: 0,
    created_at: nowISO(),
  };
  ads.unshift(ad);
  save(LS_ADS, ads);

  // price history
  const histMap = load(LS_PRICE_HIST, {});
  histMap[id] = [{ at: nowISO(), price: ad.price, currency: ad.currency || "UZS" }];
  save(LS_PRICE_HIST, histMap);

  // my ads
  const my = load(LS_MY, []);
  my.unshift(id);
  save(LS_MY, my);

  return ad;
}

export async function myAds() {
  const my = new Set(load(LS_MY, []));
  const ads = load(LS_ADS, []).filter(a => a.user_id === "me" || my.has(String(a.id)));
  return ads;
}

export async function markAdStatus(id, status) {
  const ads = load(LS_ADS, []);
  const a = ads.find(x => String(x.id) === String(id));
  if (!a) throw new Error("Ad not found");
  a.status = status;
  save(LS_ADS, ads);
  return a;
}

export async function priceHistory(adId) {
  const histMap = load(LS_PRICE_HIST, {});
  return histMap[String(adId)] || [];
}
