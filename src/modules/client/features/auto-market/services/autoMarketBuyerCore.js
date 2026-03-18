
const SAVED_SEARCH_KEY = "auto_market_saved_searches_v1";
const SAVED_ALERT_KEY = "auto_market_saved_alerts_v1";

function readList(key) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList(key, items) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {}
}

function normalizeFilters(filters = {}) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => {
    if (value === false || value === null || value === undefined) return false;
    return String(value).trim() !== "";
  }));
}

function dedupeByFilters(items, filters) {
  const sign = JSON.stringify(normalizeFilters(filters));
  return items.filter((item) => JSON.stringify(normalizeFilters(item.filters || {})) !== sign);
}

export function listSavedSearches() {
  return readList(SAVED_SEARCH_KEY);
}

export function saveSearchDraft(filters = {}, label = "") {
  const items = readList(SAVED_SEARCH_KEY);
  const normalized = {
    id: `saved-${Date.now()}`,
    label: label || buildSavedSearchLabel(filters),
    filters: normalizeFilters(filters),
    createdAt: new Date().toISOString(),
  };
  writeList(SAVED_SEARCH_KEY, [normalized, ...dedupeByFilters(items, filters)].slice(0, 16));
  return normalized;
}

export function removeSavedSearch(id) {
  const items = readList(SAVED_SEARCH_KEY).filter((item) => item.id !== id);
  writeList(SAVED_SEARCH_KEY, items);
  return items;
}

export function listSavedAlerts() {
  return readList(SAVED_ALERT_KEY);
}

export function saveAlertDraft(filters = {}, label = "") {
  const items = readList(SAVED_ALERT_KEY);
  const normalized = {
    id: `alert-${Date.now()}`,
    label: label || buildSavedSearchLabel(filters),
    filters: normalizeFilters(filters),
    cadence: "instant",
    createdAt: new Date().toISOString(),
  };
  writeList(SAVED_ALERT_KEY, [normalized, ...dedupeByFilters(items, filters)].slice(0, 16));
  return normalized;
}

export function removeSavedAlert(id) {
  const items = readList(SAVED_ALERT_KEY).filter((item) => item.id !== id);
  writeList(SAVED_ALERT_KEY, items);
  return items;
}

export function buildSavedSearchLabel(filters = {}) {
  const parts = [];
  if (filters.brand) parts.push(filters.brand);
  if (filters.model) parts.push(filters.model);
  if (filters.bodyType) parts.push(filters.bodyType);
  if (filters.city) parts.push(filters.city);
  if (filters.maxPrice) parts.push(`gacha ${Number(filters.maxPrice).toLocaleString()} so'm`);
  if (filters.fuel_type) parts.push(filters.fuel_type);
  if (filters.sellerType) parts.push(filters.sellerType === "dealer" ? "Diler" : "Ega");
  return parts.join(" • ") || "Mening qidiruvim";
}

export function buildBuyerQuickFilters() {
  return [
    { key: "budget-city", label: "Shahar uchun tejamkor", patch: { maxPrice: 180000000, bodyType: "Sedan", sort: "cheap" } },
    { key: "family", label: "Oila uchun keng", patch: { bodyType: "SUV", yearFrom: 2020 } },
    { key: "ev", label: "Elektro va gibrid", patch: { fuel_type: "Elektro", batteryWarranty: true } },
    { key: "best-deal", label: "Eng qulay variantlar", patch: { sort: "cheap", yearFrom: 2021, inspectionMin: 70 } },
    { key: "dealer-trust", label: "Tekshirilgan dilerlar", patch: { sellerType: "dealer", inspectionMin: 75 } },
  ];
}

export function buildBudgetBrowseCards() {
  return [
    { key: "budget-1", title: "150 mln gacha", text: "Ishga va shahar uchun tez topiladigan variantlar.", patch: { maxPrice: 150000000, sort: "cheap" }, tone: "#2563eb" },
    { key: "budget-2", title: "150–250 mln", text: "Oilaviy va balansli mashinalar uchun yaxshi segment.", patch: { minPrice: 150000000, maxPrice: 250000000, yearFrom: 2019 }, tone: "#7c3aed" },
    { key: "budget-3", title: "250 mln+", text: "Yuqori komplektatsiya va premium variantlar.", patch: { minPrice: 250000000, yearFrom: 2021, sort: "year_new" }, tone: "#0f766e" },
  ];
}

export function buildScenarioBrowseCards() {
  return [
    { key: "city", title: "Shahar uchun", caption: "Kam xarajat, oson boshqaruv", patch: { bodyType: "Sedan", maxPrice: 200000000, sort: "cheap" } },
    { key: "family", title: "Oila uchun", caption: "Keng va xavfsiz", patch: { bodyType: "SUV", yearFrom: 2020, inspectionMin: 72 } },
    { key: "work", title: "Ish uchun", caption: "Mustahkam va tejamkor", patch: { sellerType: "dealer", fuel_type: "Gaz-Metan" } },
    { key: "electric", title: "Elektro", caption: "Batareya kafolati bilan", patch: { fuel_type: "Elektro", batteryWarranty: true } },
  ];
}

export function buildAdvancedFilterSections() {
  return [
    {
      key: "trust",
      title: "Ishonch bo'yicha",
      controls: [
        { type: "switch", key: "priceDropOnly", label: "Narxi tushganlar" },
        { type: "switch", key: "batteryWarranty", label: "Batareya kafolati" },
        { type: "select", key: "sellerType", label: "Sotuvchi turi", options: [
          { value: "dealer", label: "Diler" },
          { value: "private", label: "Ega" },
        ]},
      ],
    },
    {
      key: "spec",
      title: "Texnik tanlov",
      controls: [
        { type: "select", key: "transmission", label: "Uzatma", options: [
          { value: "Avtomat", label: "Avtomat" },
          { value: "Mexanika", label: "Mexanika" },
        ]},
        { type: "select", key: "driveType", label: "Yuritma", options: [
          { value: "Oldi (FWD)", label: "Oldi (FWD)" },
          { value: "Orqa (RWD)", label: "Orqa (RWD)" },
          { value: "4x4 (AWD)", label: "4x4 (AWD)" },
        ]},
        { type: "slider", key: "inspectionMin", label: "Tekshiruv minimumi", min: 0, max: 100 },
      ],
    },
  ];
}

export function buildNoResultRescue(filters = {}) {
  return [
    { key: "drop-brand", title: "Markani bo'shating", hint: "Bir nechta mos variant chiqishi mumkin.", patch: { brand: "", model: "" }, enabled: !!filters.brand },
    { key: "raise-budget", title: "Budjetni biroz oshiring", hint: "Yangi yil va yaxshi holat chiqishi osonlashadi.", patch: { maxPrice: filters.maxPrice ? Number(filters.maxPrice) + 50000000 : "" }, enabled: !!filters.maxPrice },
    { key: "expand-city", title: "Shahar filtrini olib tashlang", hint: "Yaqin hududlardan ham natija ko'rinadi.", patch: { city: "" }, enabled: !!filters.city },
  ].filter((item) => item.enabled);
}

export function buildSavedSearchInsights(items = [], filters = {}) {
  return [
    { key: "saved-total", label: "Saqlangan qidiruv", value: String(items.length) },
    { key: "active-filters", label: "Faol filtrlar", value: String(Object.values(normalizeFilters(filters)).length) },
    { key: "budget-mode", label: "Budjet", value: filters.maxPrice ? `${Number(filters.maxPrice).toLocaleString()} so'm gacha` : "Erkin" },
  ];
}

export function buildSavedAlertInsights(items = [], filters = {}) {
  return [
    { key: "alert-total", label: "Saqlangan alert", value: String(items.length) },
    { key: "watch-mode", label: "Kuzatuv rejimi", value: items.length ? "Faol" : "Yoqilmagan" },
    { key: "price-drop-mode", label: "Narx signali", value: filters.priceDropOnly ? "Kuzatilmoqda" : "Barcha e'lonlar" },
  ];
}

export function buildOwnershipEstimate(car = {}) {
  const price = Number(car.price || 0);
  return [
    { key: "fuel", label: "Oyiga yoqilg'i", value: `${Math.round(price * 0.008).toLocaleString()} so'm` },
    { key: "service", label: "Oyiga servis", value: `${Math.round(price * 0.004).toLocaleString()} so'm` },
    { key: "reserve", label: "Zaxira fond", value: `${Math.round(price * 0.003).toLocaleString()} so'm` },
  ];
}

export function buildDecisionChecklist(car = {}) {
  return [
    { key: "price", title: "Narxni median bilan solishtiring", ok: Number(car.market_median_price || car.price || 0) >= Number(car.price || 0) },
    { key: "inspection", title: "Tekshiruv balini ko'ring", ok: Number(car.inspection_score || 0) >= 70 },
    { key: "seller", title: "Sotuvchi javob tezligini baholang", ok: true },
  ];
}

export function buildCompareWinner(cars = []) {
  if (!cars.length) return null;
  const ranked = [...cars].sort((a, b) => {
    const aScore = Number(a.inspection_score || 0) + (a.price_drop_ready ? 6 : 0) - Number(a.price || 0) / 10000000;
    const bScore = Number(b.inspection_score || 0) + (b.price_drop_ready ? 6 : 0) - Number(b.price || 0) / 10000000;
    return bScore - aScore;
  });
  return ranked[0];
}
