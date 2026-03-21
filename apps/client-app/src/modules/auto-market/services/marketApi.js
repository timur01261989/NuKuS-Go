/**
 * AUTO MARKET API (mock-first).
 * Keyin Supabase / backend ulash oson bo'lishi uchun bitta joyda.
 */
import { load, nowISO, save, uid } from "./marketApi.helpers";
import { LS_ADS, LS_FAV, LS_MY, LS_PRICE_HIST, applyCarFilters, seedAds, seedBattles, seedSpareParts } from "./marketApi.seed";
import { isAutoMarketMockMode } from "./marketMode";

if (isAutoMarketMockMode()) seedAds();

export async function listCars(filters = {}, { page = 1, pageSize = 12 } = {}) {
  const ads = load(LS_ADS, []);
  const filtered = applyCarFilters(ads, filters);
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
  return applyCarFilters(ads, filters);
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
  const filtered = applyCarFilters(ads, filters);
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
  return applyCarFilters(ads, filters);
}

// ─── Zapchast ─────────────────────────────────────────────────────────────────

function seedZapchast_legacy_wrapper() {
  seedSpareParts(load, save);
}
seedSpareParts(load, save);

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

function seedBattles_legacy_wrapper() {
  seedBattles(load, save);
}
seedBattles(load, save);

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
