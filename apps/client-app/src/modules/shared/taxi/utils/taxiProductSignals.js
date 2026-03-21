export function formatRelativeSeconds(updatedAt) {
  if (!updatedAt) return "hozirgina";
  const diffSec = Math.max(0, Math.round((Date.now() - Number(updatedAt)) / 1000));
  if (diffSec < 5) return "hozirgina";
  if (diffSec < 60) return `${diffSec} soniya oldin`;
  const min = Math.round(diffSec / 60);
  return `${min} daqiqa oldin`;
}

export function buildTaxiEtaMeta({ etaMin, updatedAt }) {
  return {
    etaLabel: etaMin ? `~${etaMin} daqiqa` : "Hisoblanmoqda",
    freshnessLabel: formatRelativeSeconds(updatedAt),
    isStale: updatedAt ? Date.now() - Number(updatedAt) > 45000 : false,
  };
}

export function buildDriverConnectionMeta({ updatedAt, accuracy, isOnline }) {
  const ageMs = updatedAt ? Date.now() - Number(updatedAt) : Infinity;
  const heartbeat = ageMs < 15000 ? "barqaror" : ageMs < 45000 ? "sekin" : "uzilgan";
  const accuracyBand =
    accuracy == null ? "aniqlanmagan" : accuracy <= 15 ? "yuqori" : accuracy <= 35 ? "o‘rtacha" : "past";
  return {
    heartbeat,
    accuracyBand,
    isHealthy: isOnline && ageMs < 45000,
    freshnessLabel: formatRelativeSeconds(updatedAt),
  };
}

export function buildTaxiRouteMeta(route) {
  if (!route) return { hasFallback: false, notice: "", source: "unknown" };
  const hasFallback = route.source === "fallback" || route.isFallback === true;
  return {
    hasFallback,
    source: route.source || "live",
    notice: hasFallback
      ? "Yo‘l vaqtinchalik taxminiy marshrut bo‘yicha ko‘rsatildi"
      : "Yo‘l va vaqt jonli marshrut asosida hisoblandi",
  };
}

export function buildTaxiCancelReasons() {
  return [
    { key: "delay", label: "Haydovchi kechikdi" },
    { key: "route_change", label: "Manzil o‘zgardi" },
    { key: "plan_changed", label: "Reja o‘zgardi" },
  ];
}

export function buildDriverDayMetrics({ earnings, activeOrder }) {
  const todayUzs = Number(earnings?.todayUzs || 0);
  const weekUzs = Number(earnings?.weekUzs || 0);
  return {
    todayLabel: `${todayUzs.toLocaleString("uz-UZ")} so‘m`,
    weekLabel: `${weekUzs.toLocaleString("uz-UZ")} so‘m`,
    tripsToday: Number(earnings?.tripsToday || 0),
    activeState: activeOrder ? "faol safar bor" : "kutish rejimi",
  };
}
