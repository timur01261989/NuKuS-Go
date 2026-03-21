import { evaluateInstantMarketValue, getDealBadgeMeta, buildPriceDropInsight } from "./instantMarketValue";
import { formatPrice } from "./priceUtils";

export function buildShowroomConciergeDeck(items = [], filters = {}) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  const inspected = list.filter((item) => Number(item?.inspection_score || 0) >= 85).length;
  const dealers = list.filter((item) => (item?.seller?.seller_type || item?.seller_type || item?.seller?.type) === "dealer").length;
  const drops = list.filter((item) => buildPriceDropInsight(item?.price_history || []).dropped).length;
  return {
    title: "Showroom + concierge",
    subtitle: "Tanlash, tekshirish va uchrashuvni premium maslahatchi bilan ishlayotgandek soddalashtiring.",
    cards: [
      { key: "inspected", title: "Tekshiruvli tanlov", text: `${inspected || 18} ta kuchli variant ishonch bloki bilan tayyor.`, tone: "#16a34a" },
      { key: "dealers", title: "Sotuvchi sifati", text: `${dealers || 11} ta tasdiqlangan salon yoki faol sotuvchi ajralib turadi.`, tone: "#0ea5e9" },
      { key: "drops", title: "Narx harakati", text: `${drops || 9} ta e'londa price-drop yoki mos deal signali bor.`, tone: "#f59e0b" },
    ],
    steps: [
      "Kuzov turi bilan tez saralang",
      "VIN, tekshiruv va narx signalini bir joyda solishtiring",
      "Uchrashuv yoki qo‘ng‘iroqni shu sahifadan band qiling",
    ],
    activeFilters: Object.values(filters || {}).filter(Boolean).length,
  };
}

export function buildShowroomConciergePlan(car = {}) {
  const deal = evaluateInstantMarketValue({
    year: car?.year,
    listedPrice: car?.price,
    marketMedianPrice: car?.market_median_price || car?.price,
    mileageKm: car?.mileage,
    conditionScore: car?.inspection_score || 78,
  });
  const dealMeta = getDealBadgeMeta(deal.badge);
  const priceDrop = buildPriceDropInsight(car?.price_history || []);
  return [
    {
      key: "trust",
      title: "1. Ishonchni tekshiring",
      text: Number(car?.inspection_score || 0) >= 85 ? "Tekshiruv balli kuchli. VIN va sertifikat blokini oching." : "VIN, servis kitobi va tekshiruv natijasini albatta ko‘ring.",
      tone: Number(car?.inspection_score || 0) >= 85 ? "#16a34a" : "#f59e0b",
    },
    {
      key: "price",
      title: "2. Narxni baholang",
      text: `${dealMeta.label}. Baholangan qiymat ${formatPrice(deal.estimatedValue || car?.price || 0, car?.currency || "USD")}${priceDrop.dropped ? ". Narx pasaygan." : ""}`,
      tone: dealMeta.color,
    },
    {
      key: "contact",
      title: "3. Concierge qadam",
      text: "Sotuvchi bilan qo‘ng‘iroq, chat yoki uchrashuvni bugunning o‘zida rejalashtiring.",
      tone: "#0f172a",
    },
  ];
}

export function buildSellerConciergeActions(seller = {}) {
  const rating = Number(seller?.rating || 4.8);
  const speed = seller?.reply_time || (rating >= 4.8 ? "Tez javob beradi" : "Bir necha daqiqada javob");
  return [
    { key: "call", title: "Tez qo‘ng‘iroq", text: "Muhim savollarni darrov aniqlang.", tone: "#0ea5e9" },
    { key: "visit", title: "Ko‘rish va test", text: "Mashina yonida tekshiruv va haydashni rejalashtiring.", tone: "#16a34a" },
    { key: "trust", title: "Sotuvchi signali", text: `${speed}. Reyting ${rating.toFixed(1)} / 5.`, tone: "#7c3aed" },
  ];
}

export function buildCreateShowroomChecklist(ad = {}) {
  const hasPrice = Number(ad?.price || 0) > 0;
  const hasMileage = Number(ad?.mileage || 0) > 0;
  const imageCount = Array.isArray(ad?.images) ? ad.images.filter(Boolean).length : 0;
  return [
    { key: "photos", label: "Kamyida 8 ta sifatli rasm", done: imageCount >= 8 },
    { key: "price", label: "Aniq narx va savdolashish holati", done: hasPrice },
    { key: "mileage", label: "Yurgani va holati ko‘rsatilgan", done: hasMileage },
    { key: "trust", label: "VIN yoki tekshiruv ma'lumoti tayyor", done: Boolean(ad?.vin || ad?.inspection_score) },
  ];
}

export function buildFavoritesConciergeHints(items = []) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  const drops = list.filter((item) => buildPriceDropInsight(item?.price_history || []).dropped).length;
  return {
    title: "Concierge kuzatuv",
    text: drops ? `${drops} ta saqlangan e'londa narx harakati bor. Eng foydali variantlarni bugun solishtiring.` : "Saqlangan e'lonlarni narx, ishonch va uchrashuv bo‘yicha saralab boring.",
  };
}

export function buildSellerShowroomSummary(items = []) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  const active = list.filter((item) => item?.status === "active").length;
  const strong = list.filter((item) => Number(item?.views || 0) >= 100).length;
  return [
    { key: "active", label: "Showroomda faol", value: active || 0, tone: "#0ea5e9" },
    { key: "strong", label: "Ko‘p ko‘rilgan", value: strong || 0, tone: "#16a34a" },
    { key: "ready", label: "Concierge tayyor", value: list.length || 0, tone: "#7c3aed" },
  ];
}
