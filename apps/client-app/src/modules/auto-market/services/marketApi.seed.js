import { BRANDS, MODELS_BY_BRAND, CITIES, FUELS, TRANSMISSIONS, COLORS, BODY_TYPES, DRIVE_TYPES } from "./staticData";
import { load, nowISO, randomFrom, save, uid } from "./marketApi.helpers";

export const LS_ADS = "auto_market_ads_v1";
export const LS_FAV = "auto_market_fav_v1";
export const LS_MY = "auto_market_my_v1";
export const LS_PRICE_HIST = "auto_market_price_hist_v1";

export function seedAds() {
  const existing = load(LS_ADS, null);
  if (Array.isArray(existing) && existing.length) return;

  const brand = () => randomFrom(BRANDS).name;
  const model = (b) => randomFrom(MODELS_BY_BRAND[b] || ["Model"]);

  const gen = (i) => {
    const b = brand();
    const m = model(b);
    const priceUZS = 45000000 + i * 2500000;
    const city = randomFrom(CITIES);
    const id = uid();
    return {
      id,
      user_id: i % 5 === 0 ? "me" : `user_${i % 7}`,
      brand: b,
      model: m,
      year: 2009 + (i % 15),
      mileage: 30000 + i * 9500,
      price: priceUZS,
      currency: "UZS",
      city,
      location: { lat: 42.46 + (i % 10) * 0.01, lng: 59.61 + (i % 10) * 0.01, city },
      fuel_type: randomFrom(FUELS),
      transmission: randomFrom(TRANSMISSIONS),
      color: randomFrom(COLORS),
      body_type: randomFrom(BODY_TYPES),
      drive_type: randomFrom(DRIVE_TYPES),
      battery_warranty: i % 5 === 0,
      seller_type: i % 4 === 0 ? "dealer" : "private",
      inspection_score: 62 + (i % 5) * 8,
      market_median_price: Math.round(priceUZS * (0.92 + (i % 4) * 0.03)),
      price_drop_ready: i % 3 === 0,
      engine: `${1.5 + (i % 4) * 0.2}L`,
      status: "active",
      is_top: i % 7 === 0,
      views: Math.floor(Math.random() * 2200),
      kredit: i % 6 === 0,
      exchange: i % 9 === 0,
      comfort: { ac: i % 2 === 0, abs: i % 3 === 0, sunroof: i % 4 === 0, airbags: i % 2 === 0 },
      description: "Holati a'lo. Hujjatlar joyida. Ko'rib kelish mumkin.",
      seller: { name: i % 5 === 0 ? "Timur" : `Sotuvchi ${i}`, phone: "+998 90 000 00 00", rating: 4.6 + (i % 4) * 0.1 },
      vin: i % 8 === 0 ? "XTA00000000000000" : "",
      images: [
        `https://picsum.photos/seed/auto_${id}_1/900/650`,
        `https://picsum.photos/seed/auto_${id}_2/900/650`,
        `https://picsum.photos/seed/auto_${id}_3/900/650`,
      ],
      created_at: new Date(Date.now() - i * 1000 * 60 * 60 * 10).toISOString(),
    };
  };

  const ads = Array.from({ length: 36 }, (_, i) => gen(i + 1));
  save(LS_ADS, ads);
  const histMap = {};
  ads.forEach((a) => {
    histMap[a.id] = [
      { at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), price: a.price + 1500000, currency: a.currency },
      { at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), price: a.price + 500000, currency: a.currency },
      { at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), price: a.price, currency: a.currency },
    ];
  });
  save(LS_PRICE_HIST, histMap);
}

export function applyCarFilters(list, f = {}) {
  let out = [...list];
  const q = String(f.q || "").trim().toLowerCase();
  if (q) {
    out = out.filter((a) => `${a.brand} ${a.model} ${a.city} ${a.year}`.toLowerCase().includes(q));
  }
  if (f.city) out = out.filter((a) => a.city === f.city);
  if (f.brand) out = out.filter((a) => a.brand === f.brand);
  if (f.model) out = out.filter((a) => a.model === f.model);
  if (f.yearFrom) out = out.filter((a) => Number(a.year) >= Number(f.yearFrom));
  if (f.yearTo) out = out.filter((a) => Number(a.year) <= Number(f.yearTo));
  if (f.minPrice) out = out.filter((a) => Number(a.price) >= Number(f.minPrice));
  if (f.maxPrice) out = out.filter((a) => Number(a.price) <= Number(f.maxPrice));
  if (f.bodyType) out = out.filter((a) => String(a.body_type || "").toLowerCase() === String(f.bodyType).toLowerCase());
  if (f.fuel_type) out = out.filter((a) => String(a.fuel_type || "").toLowerCase() === String(f.fuel_type).toLowerCase());
  if (f.transmission) out = out.filter((a) => String(a.transmission || "").toLowerCase() === String(f.transmission).toLowerCase());
  if (f.color) out = out.filter((a) => String(a.color || "").toLowerCase() === String(f.color).toLowerCase());
  if (f.driveType) out = out.filter((a) => String(a.drive_type || "").toLowerCase() === String(f.driveType).toLowerCase());
  if (f.sellerType) out = out.filter((a) => String(a.seller_type || "").toLowerCase() === String(f.sellerType).toLowerCase());
  if (f.inspectionMin) out = out.filter((a) => Number(a.inspection_score || 0) >= Number(f.inspectionMin));
  if (f.priceDropOnly) out = out.filter((a) => !!a.price_drop_ready);
  if (f.batteryWarranty) out = out.filter((a) => !!a.battery_warranty);
  if (f.kredit) out = out.filter((a) => !!a.kredit);
  if (f.exchange) out = out.filter((a) => !!a.exchange);
  if (f.nearMe && f.center?.lat && f.center?.lng) {
    const R = Number(f.radiusKm || 10);
    const hav = (lat1, lon1, lat2, lon2) => {
      const toRad = (d) => (d * Math.PI) / 180;
      const rr = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      return rr * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };
    out = out.filter((a) => hav(f.center.lat, f.center.lng, a.location?.lat || 0, a.location?.lng || 0) <= R);
  }
  switch (f.sort) {
    case "cheap": out.sort((a,b)=>a.price-b.price); break;
    case "expensive": out.sort((a,b)=>b.price-a.price); break;
    case "year_new": out.sort((a,b)=>Number(b.year)-Number(a.year)); break;
    default: out.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  }
  return out;
}

export function seedSpareParts(loadFn, saveFn) {
  const key = "auto_market_zapchast_v1";
  const ex = loadFn(key, null);
  if (Array.isArray(ex) && ex.length) return;
  const items = Array.from({ length: 18 }, (_, i) => ({
    id: uid(),
    title: `Ehtiyot qism ${i + 1}`,
    category: i % 2 === 0 ? "Motor" : "Kuzov",
    price: 50000 + i * 15000,
    city: randomFrom(CITIES),
    images: [`https://picsum.photos/seed/zap_${i}/900/650`],
    created_at: nowISO(),
  }));
  saveFn(key, items);
}

export function seedBattles(loadFn, saveFn) {
  const key = "auto_market_battles_v1";
  const ex = loadFn(key, null);
  if (Array.isArray(ex) && ex.length) return;
  const items = Array.from({ length: 10 }, (_, i) => ({
    id: uid(),
    left: `Model ${i + 1}A`,
    right: `Model ${i + 1}B`,
    votes_left: 20 + i * 7,
    votes_right: 18 + i * 5,
    created_at: nowISO(),
  }));
  saveFn(key, items);
}
