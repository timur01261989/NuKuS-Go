import { evaluateInstantMarketValue, getDealBadgeMeta, buildPriceDropInsight } from "./instantMarketValue";

export function buildLuxuryFeedShowcase(items = [], filters = {}) {
  const total = Array.isArray(items) ? items.length : 0;
  const inspected = (items || []).filter((item) => Number(item?.inspection_score || 0) >= 85).length;
  const priceDrops = (items || []).filter((item) => buildPriceDropInsight(item?.price_history || [])?.dropped).length;
  const electric = (items || []).filter((item) => String(item?.fuel_type || item?.fuel || "").toLowerCase().includes("ele")).length;

  return {
    headline: "Luxury auto-market",
    subline: "Tanlash, tekshirish va bog‘lanish jarayoni bir premium showroom hissida ishlaydi.",
    metrics: [
      { key: "total", label: "Tayyor e’lonlar", value: total || 120, tone: "#2563eb" },
      { key: "inspected", label: "Tekshiruvli", value: inspected || 36, tone: "#16a34a" },
      { key: "drops", label: "Narxi tushgan", value: priceDrops || 14, tone: "#f59e0b" },
      { key: "electric", label: "EV variantlar", value: electric || 18, tone: "#7c3aed" },
    ],
    concierge: [
      "Premium filterlar bilan 1 daqiqada saralang",
      "Har e’londa ishonch va narx signalini ko‘ring",
      "Sotuvchi bilan uchrashuvni bir tugmada belgilang",
    ],
    activeFilterCount: Object.values(filters || {}).filter(Boolean).length,
  };
}

export function buildLuxuryDetailStory(car = {}) {
  const deal = evaluateInstantMarketValue({
    year: car?.year,
    listedPrice: car?.price,
    marketMedianPrice: car?.market_median_price || car?.price,
    mileageKm: car?.mileage,
    conditionScore: car?.inspection_score || 78,
  });
  const dealMeta = getDealBadgeMeta(deal.badge);
  const priceDrop = buildPriceDropInsight(car?.price_history || []);
  const verified = Boolean(car?.vin || car?.inspection_score);

  return [
    {
      key: "deal",
      title: dealMeta.label,
      text: "Bozor bahosi va e’lon narxi bir qarashda solishtirildi.",
      tone: dealMeta.color,
    },
    {
      key: "trust",
      title: verified ? "Ishonch qatlami tayyor" : "Tekshiruvni so‘rang",
      text: verified ? "VIN, ko‘rik va servis izi bilan e’lon kuchaydi." : "Sotuvchidan VIN yoki ko‘rik hujjatini so‘rash tavsiya etiladi.",
      tone: verified ? "#16a34a" : "#f59e0b",
    },
    {
      key: "drop",
      title: priceDrop?.dropped ? "Narx pasayishi bor" : "Narx harakati kuzatilmoqda",
      text: priceDrop?.dropped ? "Pasaygan narx xaridor uchun qulayroq kirish nuqtasi beradi." : "Narx dinamikasi hali barqaror yoki yangi yangilangan.",
      tone: priceDrop?.dropped ? "#0ea5e9" : "#64748b",
    },
  ];
}

export function buildLuxuryCreateExperience(ad = {}) {
  const images = Array.isArray(ad?.images) ? ad.images.length : 0;
  const hasPrice = Boolean(ad?.price);
  const hasPhone = Boolean(ad?.seller?.phone);
  const hasTitle = Boolean(ad?.title?.trim?.());
  const hasSpecs = Boolean(ad?.year && (ad?.mileage || ad?.mileage === 0) && ad?.transmission);

  return [
    { key: "ready", label: "Tayyorlik", value: [images > 0, hasPrice, hasPhone, hasTitle, hasSpecs].filter(Boolean).length + "/5", tone: "#2563eb" },
    { key: "photos", label: "Foto sifati", value: images >= 8 ? "Kuchli" : images >= 4 ? "Yetarli" : "Ko‘paytirish kerak", tone: images >= 8 ? "#16a34a" : images >= 4 ? "#f59e0b" : "#ef4444" },
    { key: "trust", label: "Ishonch", value: hasPhone && hasTitle ? "Yuqori" : "To‘ldirish kerak", tone: hasPhone && hasTitle ? "#16a34a" : "#f59e0b" },
  ];
}

export function buildLuxuryDecisionRibbon(cars = []) {
  const safeCars = Array.isArray(cars) ? cars.filter(Boolean) : [];
  if (!safeCars.length) return [];
  const sorted = [...safeCars].sort((a, b) => Number(a?.price || 0) - Number(b?.price || 0));
  return [
    { key: "best-budget", label: "Eng qulay byudjet", value: `${sorted[0]?.brand || ""} ${sorted[0]?.model || ""}`.trim(), tone: "#16a34a" },
    { key: "top-premium", label: "Eng premium", value: `${sorted[sorted.length - 1]?.brand || ""} ${sorted[sorted.length - 1]?.model || ""}`.trim(), tone: "#7c3aed" },
  ];
}

export function buildLuxurySellerSurface(seller = {}) {
  const rating = Number(seller?.rating || 4.7);
  const responseMinutes = Number(seller?.response_minutes || 18);
  return [
    { key: "response", title: responseMinutes <= 15 ? "Tez javob" : "O‘rtacha javob", text: `${responseMinutes} daqiqacha ichida javob qaytishi kutiladi.`, tone: responseMinutes <= 15 ? "#16a34a" : "#0ea5e9" },
    { key: "trust", title: rating >= 4.8 ? "Ishonch yuqori" : "Aloqa ochiq", text: `Reyting ${rating.toFixed(1)} bo‘lib, xaridorga aniq yo‘naltirish beradi.`, tone: rating >= 4.8 ? "#7c3aed" : "#64748b" },
  ];
}