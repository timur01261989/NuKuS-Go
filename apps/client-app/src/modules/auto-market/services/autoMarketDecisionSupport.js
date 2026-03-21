import { evaluateInstantMarketValue, getDealBadgeMeta, buildPriceDropInsight } from "./instantMarketValue";
import { formatPrice } from "./priceUtils";

export function buildBuyerDecisionChecklist(car = {}) {
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
      key: "deal",
      title: "Narx signali",
      text: `${dealMeta.label}. Taxminiy bozor bahosi ${formatPrice(deal.estimatedValue || car?.price || 0, car?.currency || "USD")}.`,
      tone: dealMeta.color,
    },
    {
      key: "trust",
      title: "Ishonch",
      text: car?.vin ? "VIN va tekshiruv bloklarini ko‘rib chiqing." : "VIN hali ko‘rsatilmagan, sotuvchidan tasdiq so‘rang.",
      tone: car?.vin ? "#16a34a" : "#f59e0b",
    },
    {
      key: "next-step",
      title: "Keyingi qadam",
      text: priceDrop?.dropped ? "Narx tushgan. Uchrashuvni tez band qilish foydali." : "Sotuvchi bilan yozishib, ko‘rish vaqtini band qiling.",
      tone: "#0ea5e9",
    },
  ];
}

export function buildCompareHighlights(cars = []) {
  const list = Array.isArray(cars) ? cars.filter(Boolean) : [];
  if (!list.length) return { cards: [], bestValueId: null };
  const scored = list.map((car) => {
    const deal = evaluateInstantMarketValue({
      year: car?.year,
      listedPrice: car?.price,
      marketMedianPrice: car?.market_median_price || car?.price,
      mileageKm: car?.mileage,
      conditionScore: car?.inspection_score || 78,
    });
    const score = (deal.badge === "great-deal" ? 4 : deal.badge === "good-deal" ? 3 : deal.badge === "fair-price" ? 2 : 1)
      + ((Number(car?.inspection_score || 78) >= 85) ? 1 : 0)
      + ((Number(car?.seller?.rating || 4.7) >= 4.8) ? 1 : 0);
    return { car, deal, score };
  }).sort((a, b) => b.score - a.score);

  const bestValueId = scored[0]?.car?.id ?? null;
  const cards = scored.slice(0, 3).map(({ car, deal }) => {
    const meta = getDealBadgeMeta(deal.badge);
    return {
      key: String(car?.id || car?.vin || car?.model || Math.random()),
      title: `${car?.brand || ""} ${car?.model || ""}`.trim() || "Variant",
      subtitle: meta.label,
      text: `${formatPrice(car?.price || 0, car?.currency || "USD")} • ${car?.mileage || 0} km • ${car?.year || "-"}`,
      tone: meta.color,
      badge: meta.label,
      carId: car?.id,
    };
  });

  return { cards, bestValueId };
}

export function buildSellerPerformanceSummary(items = []) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  const active = list.filter((x) => (x?.status || "active") === "active").length;
  const archived = list.filter((x) => (x?.status || "") === "archived").length;
  const totalViews = list.reduce((sum, x) => sum + Number(x?.views || 0), 0);
  const topViewed = [...list].sort((a, b) => Number(b?.views || 0) - Number(a?.views || 0))[0];
  return [
    { key: "active", label: "Faol e’lonlar", value: String(active) },
    { key: "views", label: "Jami ko‘rishlar", value: String(totalViews) },
    { key: "archived", label: "Arxivdagilar", value: String(archived) },
    { key: "top", label: "Eng ko‘p ko‘rilgan", value: topViewed ? `${topViewed.brand || ""} ${topViewed.model || ""}`.trim() : "Hali yo‘q" },
  ];
}

export function buildSavedSearchHints(filters = {}) {
  const hints = [];
  if (filters?.brand || filters?.model) hints.push("Brend va model tanlangan, narx signalini solishtirish osonlashdi.");
  if (filters?.city) hints.push("Hudud tanlangan, uchrashuv va ko‘rish bandi tezlashadi.");
  if (filters?.priceDropReady) hints.push("Narxi tushgan e’lonlar yoqilgan.");
  if (!hints.length) hints.push("Sevimlilar ichida narx, ishonch va ko‘rish bandini bir oqimda solishtiring.");
  return hints;
}
