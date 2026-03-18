import { evaluateInstantMarketValue, getDealBadgeMeta, buildPriceDropInsight } from "./instantMarketValue";
import { formatPrice } from "./priceUtils";

export function buildPremiumFeedSignals(car = {}) {
  const deal = evaluateInstantMarketValue({
    year: car?.year,
    listedPrice: car?.price,
    marketMedianPrice: car?.market_median_price || car?.price,
    mileageKm: car?.mileage,
    conditionScore: car?.inspection_score || 78,
  });
  const meta = getDealBadgeMeta(deal.badge);
  const score = Number(car?.inspection_score || 78);
  const sellerRating = Number(car?.seller?.rating || 4.7);
  return [
    { key: "deal", label: meta.label, tone: meta.color },
    { key: "inspection", label: score >= 85 ? "Tekshiruv kuchli" : "Tekshiruvni ko'ring", tone: score >= 85 ? "#16a34a" : "#f59e0b" },
    { key: "seller", label: sellerRating >= 4.8 ? "Sotuvchi tez javob beradi" : "Sotuvchi bilan bog'laning", tone: "#0ea5e9" },
  ];
}

export function buildPremiumDetailActions(car = {}) {
  const priceDrop = buildPriceDropInsight(car?.price_history || []);
  const hasVin = Boolean(car?.vin);
  return [
    {
      key: "inspect",
      title: "Ishonchni tekshiring",
      text: hasVin ? "VIN, tekshiruv va servis tarixini bir joyda ko'ring." : "VIN yoki tekshiruv yo'q bo'lsa sotuvchidan tasdiq so'rang.",
      tone: hasVin ? "#16a34a" : "#f59e0b",
    },
    {
      key: "meet",
      title: "Ko'rish vaqtini belgilang",
      text: "Qo'ng'iroq, chat va uchrashuv tugmalarini bir oqimda ishlating.",
      tone: "#0ea5e9",
    },
    {
      key: "price",
      title: priceDrop?.dropped ? "Narx pasaygan" : "Narxni baholang",
      text: priceDrop?.dropped
        ? `Oxirgi pasayishdan keyingi narx: ${formatPrice(car?.price || 0, car?.currency || "USD")}.`
        : `Bozor bahosi bilan solishtirib qarang: ${formatPrice(car?.market_median_price || car?.price || 0, car?.currency || "USD")}.`,
      tone: "#7c3aed",
    },
  ];
}

export function buildPremiumSellerAssist(seller = {}) {
  const rating = Number(seller?.rating || 4.7);
  return [
    { key: "response", title: "Javob tezligi", text: rating >= 4.8 ? "Tez aloqaga chiqadi" : "Yozing yoki qo'ng'iroq qiling", tone: "#0ea5e9" },
    { key: "trust", title: "Sotuvchi ishonchi", text: (seller?.seller_type || seller?.type) === "dealer" ? "Diler profili tasdiqlangan" : "Shaxsiy sotuvchi profili faol", tone: "#16a34a" },
    { key: "next", title: "Keyingi qadam", text: "Avval ko'rish vaqtini belgilang, so'ng narx va hujjatlarni tekshiring.", tone: "#f59e0b" },
  ];
}

export function buildPremiumSellerChecklist(ad = {}) {
  const images = Array.isArray(ad?.images) ? ad.images.length : 0;
  return [
    { key: "photos", title: "Fotosuratlar", text: images >= 8 ? "Rasmlar yetarli" : "Kamida 8 ta sifatli rasm qo'shing", done: images >= 8 },
    { key: "price", title: "Narx signali", text: ad?.market_median_price ? "Bozor bahosi bilan solishtirilgan" : "Bozor bahosi ko'rsatilsa ishonch oshadi", done: Boolean(ad?.market_median_price) },
    { key: "vin", title: "Ishonch", text: ad?.vin ? "VIN yoki tekshiruv bor" : "VIN yoki tekshiruv blokini to'ldiring", done: Boolean(ad?.vin || ad?.inspection_score) },
  ];
}

export function buildPremiumCreateSteps(ad = {}) {
  return [
    "Marka, model va kuzov turini aniq tanlang.",
    "Tashqi ko'rinish, salon va hujjatlarning fotosuratlarini to'liq yuklang.",
    ad?.vin ? "VIN qo'shilgan — bu e'lon ishonchliroq ko'rinadi." : "VIN yoki tekshiruv ma'lumotini qo'shsangiz, xaridor tezroq qaror qiladi.",
    "Narxni bozor oralig'iga yaqin qo'ying va aloqa vaqtini belgilang.",
  ];
}
