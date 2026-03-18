export function evaluateInstantMarketValue(input = {}) {
  const year = Number(input.year || new Date().getFullYear());
  const listedPrice = Number(input.listedPrice || input.price || 0);
  const marketMedianPrice = Number(input.marketMedianPrice || listedPrice || 1);
  const mileageKm = Number(input.mileageKm || input.mileage || 0);
  const conditionScore = Number(input.conditionScore ?? 78);

  const age = Math.max(new Date().getFullYear() - year, 0);
  const agePenalty = age * 0.015;
  const mileagePenalty = Math.max(mileageKm - 60000, 0) / 10000 * 0.01;
  const conditionBoost = ((conditionScore - 70) / 100) * 0.12;

  const estimatedValue = Math.max(Math.round(marketMedianPrice * (1 - agePenalty - mileagePenalty + conditionBoost)), 0);
  const deltaPercent = estimatedValue ? ((listedPrice - estimatedValue) / estimatedValue) * 100 : 0;

  let badge = "fair-price";
  if (deltaPercent <= -10) badge = "great-deal";
  else if (deltaPercent <= -4) badge = "good-deal";
  else if (deltaPercent >= 8) badge = "high-price";

  const reasons = [];
  if (conditionScore >= 85) reasons.push("Holati bozordagi o‘xshashlardan yaxshiroq");
  if (mileageKm < 60000) reasons.push("Yurgan yo‘li nisbatan past");
  if (age >= 8) reasons.push("Yili eskiroq bo‘lgani uchun baho pasaygan");
  if (deltaPercent > 0) reasons.push("Bozor median narxidan yuqoriroq");

  return {
    estimatedValue,
    deltaPercent: Number(deltaPercent.toFixed(2)),
    badge,
    reasons,
  };
}

export function getDealBadgeMeta(badge = "fair-price") {
  switch (badge) {
    case "great-deal":
      return { label: "Juda yaxshi narx", color: "#16a34a", tone: "rgba(22,163,74,.12)" };
    case "good-deal":
      return { label: "Yaxshi narx", color: "#0ea5e9", tone: "rgba(14,165,233,.12)" };
    case "high-price":
      return { label: "Narx balandroq", color: "#ef4444", tone: "rgba(239,68,68,.12)" };
    default:
      return { label: "Bozor narxi", color: "#f59e0b", tone: "rgba(245,158,11,.12)" };
  }
}

export function buildPriceDropInsight(history = []) {
  const entries = Array.isArray(history) ? history.filter(Boolean) : [];
  if (entries.length < 2) return null;
  const first = Number(entries[0]?.price || 0);
  const last = Number(entries[entries.length - 1]?.price || 0);
  const delta = last - first;
  return {
    first,
    last,
    delta,
    dropped: delta < 0,
    label: delta < 0 ? "Narx tushgan" : delta > 0 ? "Narx oshgan" : "Narx o‘zgarmagan",
  };
}