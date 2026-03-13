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

// ═════════════════════════════════════════════════════════════════════════════
// YANGI: Vikup, Barter, Zapchast, Garaj, Battle, ServiceBook API (mock-first)
// ═════════════════════════════════════════════════════════════════════════════

const LS_VIKUP    = "auto_market_vikup_v1";
const LS_BARTER   = "auto_market_barter_v1";
const LS_ZAPCHAST = "auto_market_zapchast_v1";
const LS_GARAJ    = "auto_market_garaj_v1";
const LS_BATTLES  = "auto_market_battles_v1";
const LS_SVCBOOK  = "auto_market_svcbook_v1";

// ─── Vikup ───────────────────────────────────────────────────────────────────

/** E'lon uchun vikup shartlarini olish */
export async function getVikupByAdId(adId) {
  const list = load(LS_VIKUP, []);
  return list.find(v => String(v.ad_id) === String(adId)) || null;
}

/** Yangi vikup shartnomasi yaratish */
export async function createVikup(data) {
  const list = load(LS_VIKUP, []);
  const entry = { id: uid(), ...data, created_at: nowISO() };
  list.push(entry);
  save(LS_VIKUP, list);
  return entry;
}

/** Vikupga berilgan barcha e'lonlarni olish */
export async function listVikupAds(filters = {}) {
  const vikups = load(LS_VIKUP, []);
  const adIds  = new Set(vikups.map(v => String(v.ad_id)));
  const ads    = load(LS_ADS, []).filter(a => adIds.has(String(a.id)));
  const filtered = applyFilters(ads, filters);
  return filtered.map(ad => ({
    ...ad,
    vikup: vikups.find(v => String(v.ad_id) === String(ad.id)),
  }));
}

// ─── Barter ──────────────────────────────────────────────────────────────────

/** Barter taklifini yuborish */
export async function createBarterOffer(data) {
  const list  = load(LS_BARTER, []);
  const entry = { id: uid(), status: "pending", ...data, created_at: nowISO() };
  list.push(entry);
  save(LS_BARTER, list);
  return entry;
}

/** Barter qabul qiladigan e'lonlarni olish (exchange===true yoki barter===true) */
export async function listBarterAds(filters = {}) {
  const ads = load(LS_ADS, []).filter(a => a.exchange || a.barter);
  return applyFilters(ads, { ...filters });
}

/** Muayyan moshina mos kelsa filtrlash (offer_model bo'yicha) */
export async function listBarterAdsByOfferModel(offerBrand, offerModel, filters = {}) {
  const ads = load(LS_ADS, []).filter(a =>
    (a.exchange || a.barter) &&
    // seller ham offerModel qabul qilishga rozi deb hisoblaymiz (mock'da hammasini ko'rsatamiz)
    true
  );
  return applyFilters(ads, filters);
}

// ─── Zapchast ─────────────────────────────────────────────────────────────────

function seedZapchast() {
  const existing = load(LS_ZAPCHAST, null);
  if (Array.isArray(existing) && existing.length) return;
  const items = [
    { id: uid(), title: "Cobalt dvigatel (1.5L) — olib qo'yilgan", category: "dvigatel", compatible_brand: "Chevrolet", compatible_model: "Cobalt", compatible_years: "2013-2023", price: 3500000, currency: "UZS", condition: "used", city: "Nukus", is_razborka: true, views: 120, images: [], phone: "+998901234567", created_at: nowISO() },
    { id: uid(), title: "Gentra amortizator (old) yangi", category: "podveska", compatible_brand: "Chevrolet", compatible_model: "Gentra", compatible_years: "2015-2023", price: 450000, currency: "UZS", condition: "new", city: "Nukus", is_razborka: false, views: 45, images: [], phone: "+998901234567", created_at: nowISO() },
    { id: uid(), title: "Spark 14 disk to'plami (4 dona)", category: "disk", compatible_brand: "Chevrolet", compatible_model: "Spark", compatible_years: "2010-2020", price: 800000, currency: "UZS", condition: "used", city: "Nukus", is_razborka: false, views: 88, images: [], phone: "+998901234567", created_at: nowISO() },
    { id: uid(), title: "Nexia 3 akkumulyator 60Ah yangi", category: "elektrika", compatible_brand: "Chevrolet", compatible_model: "Nexia 3", compatible_years: "2017-2023", price: 1200000, currency: "UZS", condition: "new", city: "Nukus", is_razborka: false, views: 200, images: [], phone: "+998901234567", created_at: nowISO() },
    { id: uid(), title: "Malibu kuzov detal (o'ng eshik)", category: "kuzov", compatible_brand: "Chevrolet", compatible_model: "Malibu", compatible_years: "2018-2023", price: 2100000, currency: "UZS", condition: "damaged", city: "Toshkent", is_razborka: false, views: 30, images: [], phone: "+998901234567", created_at: nowISO() },
    { id: uid(), title: "RAZBORKA: Cobalt 2017 to'liq", category: "other", compatible_brand: "Chevrolet", compatible_model: "Cobalt", compatible_years: "2017-2017", price: 8000000, currency: "UZS", condition: "damaged", city: "Nukus", is_razborka: true, views: 310, images: [], phone: "+998901234567", created_at: nowISO() },
  ];
  save(LS_ZAPCHAST, items);
}
seedZapchast();

export async function listZapchast({ brand = "", model = "", category = "", is_razborka = false, q = "" } = {}) {
  let list = load(LS_ZAPCHAST, []);
  if (brand)       list = list.filter(z => z.compatible_brand === brand);
  if (model)       list = list.filter(z => z.compatible_model === model);
  if (category)    list = list.filter(z => z.category === category);
  if (is_razborka) list = list.filter(z => z.is_razborka === true);
  if (q) {
    const qq = q.toLowerCase();
    list = list.filter(z => `${z.title} ${z.compatible_brand} ${z.compatible_model}`.toLowerCase().includes(qq));
  }
  return list;
}

export async function createZapchastAd(data) {
  const list = load(LS_ZAPCHAST, []);
  const entry = { id: uid(), views: 0, is_active: true, ...data, created_at: nowISO() };
  list.unshift(entry);
  save(LS_ZAPCHAST, list);
  return entry;
}

// ─── Garaj ────────────────────────────────────────────────────────────────────

export async function getGaraj() {
  return load(LS_GARAJ, []);
}

export async function addToGaraj(ad) {
  const list = load(LS_GARAJ, []);
  if (list.find(g => String(g.ad_id) === String(ad.id))) return list;
  list.unshift({
    id: uid(),
    ad_id: ad.id,
    brand: ad.brand,
    model: ad.model,
    year: ad.year,
    price_at_add: ad.price,
    current_price: ad.price,
    currency: ad.currency,
    image_url: ad.images?.[0] || null,
    notify_price_drop: true,
    added_at: nowISO(),
  });
  save(LS_GARAJ, list);
  return list;
}

export async function removeFromGaraj(adId) {
  const list = load(LS_GARAJ, []).filter(g => String(g.ad_id) !== String(adId));
  save(LS_GARAJ, list);
  return list;
}

export async function isInGaraj(adId) {
  return load(LS_GARAJ, []).some(g => String(g.ad_id) === String(adId));
}

// ─── Auto Battle ──────────────────────────────────────────────────────────────

function seedBattles() {
  const existing = load(LS_BATTLES, null);
  if (Array.isArray(existing) && existing.length) return;
  const battles = [
    {
      id: uid(), title: "Gentra 2023 vs Cobalt 2023",
      car_a_id: "demo_a1", car_a_label: "Chevrolet Gentra 2023", votes_a: 142,
      car_b_id: "demo_b1", car_b_label: "Chevrolet Cobalt 2023", votes_b: 98,
      is_active: true, created_at: nowISO(),
    },
    {
      id: uid(), title: "KIA K5 vs Hyundai Sonata",
      car_a_id: "demo_a2", car_a_label: "KIA K5 2022",           votes_a: 87,
      car_b_id: "demo_b2", car_b_label: "Hyundai Sonata 2022",   votes_b: 113,
      is_active: true, created_at: nowISO(),
    },
    {
      id: uid(), title: "Toyota Camry vs Mercedes E-Class",
      car_a_id: "demo_a3", car_a_label: "Toyota Camry 2021",     votes_a: 201,
      car_b_id: "demo_b3", car_b_label: "Mercedes E-Class 2021", votes_b: 188,
      is_active: true, created_at: nowISO(),
    },
  ];
  const votes = {};
  save(LS_BATTLES, battles);
  save("auto_market_battle_votes_v1", votes);
}
seedBattles();

export async function listBattles() {
  return load(LS_BATTLES, []).filter(b => b.is_active);
}

export async function getBattleById(id) {
  return load(LS_BATTLES, []).find(b => String(b.id) === String(id)) || null;
}

export async function voteBattle(battleId, choice) {
  const VOTED_KEY = "auto_market_voted_battles_v1";
  const voted = new Set(load(VOTED_KEY, []));
  if (voted.has(String(battleId))) throw new Error("Siz allaqachon ovoz bergansiz");

  const battles = load(LS_BATTLES, []);
  const b = battles.find(x => String(x.id) === String(battleId));
  if (!b) throw new Error("Battle topilmadi");
  if (choice === "a") b.votes_a += 1; else b.votes_b += 1;
  save(LS_BATTLES, battles);

  voted.add(String(battleId));
  save(VOTED_KEY, Array.from(voted));
  return b;
}

// ─── ServiceBook (Rasxod Daftar) ─────────────────────────────────────────────

export async function getServiceBooks() {
  return load(LS_SVCBOOK, []);
}

export async function createServiceBook(data) {
  const list = load(LS_SVCBOOK, []);
  const entry = {
    id: uid(),
    records: [],
    ...data,
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  list.push(entry);
  save(LS_SVCBOOK, list);
  return entry;
}

export async function addServiceRecord(bookId, record) {
  const list = load(LS_SVCBOOK, []);
  const book = list.find(b => String(b.id) === String(bookId));
  if (!book) throw new Error("Daftar topilmadi");
  const r = { id: uid(), ...record, created_at: nowISO() };
  book.records = [...(book.records || []), r];
  book.updated_at = nowISO();
  if (record.current_mileage) book.current_mileage = record.current_mileage;
  save(LS_SVCBOOK, list);
  return book;
}

export async function updateServiceBook(bookId, data) {
  const list = load(LS_SVCBOOK, []);
  const book = list.find(b => String(b.id) === String(bookId));
  if (!book) throw new Error("Daftar topilmadi");
  Object.assign(book, data, { updated_at: nowISO() });
  save(LS_SVCBOOK, list);
  return book;
}

// ─── Narx tahlili (AI Fair Price) ─────────────────────────────────────────────
// python-ai /pipeline yoki local statistika bo'yicha narxni tahlil qiladi

export async function analyzeFairPrice({ brand, model, year, mileage, price, currency = "UZS" }) {
  // 1. Avvalo local bazadagi o'xshash mashinalar narxini olish
  const ads = load(LS_ADS, []).filter(a =>
    a.brand === brand &&
    a.model === model &&
    Math.abs(Number(a.year || 0) - Number(year || 0)) <= 2 &&
    a.status === "active"
  );

  if (!ads.length) {
    return { verdict: "unknown", label: "Ma'lumot yetarli emas", color: "#94a3b8", percentile: null, avg: null, count: 0 };
  }

  const prices = ads.map(a => Number(a.price || 0)).filter(Boolean).sort((a, b) => a - b);
  const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
  const min = prices[0];
  const max = prices[prices.length - 1];
  const p = Number(price || 0);

  const ratio = avg > 0 ? p / avg : 1;
  let verdict, label, color;

  if (ratio <= 0.90) {
    verdict = "great";     label = "A'lo narx! Bozordan arzon 🟢";  color = "#16a34a";
  } else if (ratio <= 1.05) {
    verdict = "fair";      label = "O'rtacha narx 🟡";               color = "#ca8a04";
  } else if (ratio <= 1.20) {
    verdict = "expensive"; label = "Bozor narxidan qimmatroq 🟠";    color = "#ea580c";
  } else {
    verdict = "overpriced";label = "Bozor narxidan juda qimmat 🔴";  color = "#dc2626";
  }

  const below = prices.filter(pp => pp < p).length;
  const percentile = Math.round((below / prices.length) * 100);

  return { verdict, label, color, avg, min, max, count: prices.length, percentile, ratio: Math.round(ratio * 100) / 100 };
}


export async function promoteAd(adId, promoType) {
  return { ok: true, ad_id: adId, promo_type: promoType, mock: true };
}
