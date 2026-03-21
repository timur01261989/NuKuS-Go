export function buildListingCompleteness(ad = {}) {
  const checks = [
    { key: "brand", label: "Brend va model", done: Boolean(ad?.brand && ad?.model), weight: 15 },
    { key: "year", label: "Yil va yurilgan masofa", done: Boolean(ad?.year && ad?.mileage), weight: 15 },
    { key: "price", label: "Narx va shahar", done: Boolean(ad?.price && (ad?.city || ad?.location?.city)), weight: 15 },
    { key: "photos", label: "Kamida 4 ta foto", done: Array.isArray(ad?.images) && ad.images.length >= 4, weight: 20 },
    { key: "contact", label: "Aloqa ma’lumoti", done: Boolean(ad?.seller?.phone), weight: 15 },
    { key: "description", label: "Tavsif va ishonch", done: Boolean(ad?.description && String(ad.description).trim().length >= 40), weight: 20 },
  ];
  const score = checks.reduce((sum, item) => sum + (item.done ? item.weight : 0), 0);
  return { score, checks };
}

export function buildPricingRecommendation(ad = {}) {
  const price = Number(ad?.price || 0);
  const year = Number(ad?.year || 0);
  const mileage = Number(ad?.mileage || 0);
  const ageFactor = year ? Math.max(0, 2026 - year) : 0;
  const mileageRisk = mileage > 150000 ? "high" : mileage > 90000 ? "medium" : "low";
  const recommendedMin = price ? Math.round(price * 0.95) : 0;
  const recommendedMax = price ? Math.round(price * 1.05) : 0;
  const mode = !price ? "missing" : mileageRisk === "high" || ageFactor > 10 ? "competitive" : "premium";
  return {
    mode,
    currentPrice: price,
    recommendedMin,
    recommendedMax,
    headline: !price ? "Narx kiritilmagan" : mode === "premium" ? "Premium narx oynasi mos" : "Tez sotish uchun raqobatbardosh narx tavsiya qilinadi",
    text: !price
      ? "Narx kiritilsa bozor oralig‘i va sotilish tezligi bo‘yicha tavsiya ko‘rinadi."
      : `Tavsiya oralig‘i ${recommendedMin.toLocaleString("en-US")}–${recommendedMax.toLocaleString("en-US")} UZS.`
  };
}

export function buildPromotePackages(ad = {}) {
  const hotness = Array.isArray(ad?.images) && ad.images.length >= 6 ? "high" : "medium";
  return [
    { key: "boost", title: "Tezkor ko‘rinish", price: 25000, text: "24 soat feed yuqorisi va ko‘proq ochilishlar.", accent: "#0ea5e9", recommended: hotness === "medium" },
    { key: "premium", title: "Premium e’lon", price: 55000, text: "Premium badge, kuchliroq karta va tezroq kontakt.", accent: "#8b5cf6", recommended: true },
    { key: "showroom", title: "Showroom paketi", price: 95000, text: "Premium + showroom signal + booking ustuvorligi.", accent: "#f59e0b", recommended: hotness === "high" },
  ];
}

export function buildSellerInsights(items = []) {
  const total = items.length;
  const active = items.filter((item) => item?.status === "active").length;
  const avgViews = total ? Math.round(items.reduce((s, i) => s + Number(i?.views || 0), 0) / total) : 0;
  const best = [...items].sort((a, b) => Number(b?.views || 0) - Number(a?.views || 0))[0];
  return [
    { key: "active", title: "Faol listinglar", value: active, text: "Hozir lead yig‘ayotgan e’lonlar soni.", tone: "#0ea5e9" },
    { key: "avgViews", title: "O‘rtacha ko‘rish", value: avgViews, text: "Har bir e’lon bo‘yicha o‘rtacha ko‘rish.", tone: "#8b5cf6" },
    { key: "best", title: "Eng kuchli listing", value: best ? `${best.brand || ""} ${best.model || ""}`.trim() : "—", text: "Hozir eng yaxshi ishlayotgan e’lon.", tone: "#10b981" },
  ];
}

export function buildFollowUpGuide(leads = []) {
  const hot = leads.filter((lead) => lead?.heat === "hot").length;
  return [
    `Bugun ${hot || 1} ta issiq leadga 10 daqiqa ichida javob berish tavsiya qilinadi.`,
    "Booking so‘ragan xaridorlarga slot va receipt havolasini yuboring.",
    "Muzokaradagi leadlar uchun narx yoki ko‘rish vaqti bo‘yicha keyingi qadamni belgilang.",
  ];
}
