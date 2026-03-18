export function buildMarketplaceHubCards() {
  return [
    {
      key: "buyer",
      title: "Xaridor markazi",
      text: "Qidiruv, saved search, compare va narx signalari bir joyda.",
      route: "/auto-market/saved-searches",
      tone: "#2563eb",
      action: "Qidiruvlarni boshqarish",
    },
    {
      key: "booking",
      title: "Booking va checkout",
      text: "Ko‘rish, test drive, receipt va local payment oqimlarini kuzating.",
      route: "/auto-market/seller/appointments",
      tone: "#0f766e",
      action: "Agenda ochish",
    },
    {
      key: "dealer",
      title: "Dealer va trust",
      text: "Dealer profile, review va finance surface orqali qarorni tezlashtiring.",
      route: "/auto-market/dealer/showroom-main",
      tone: "#7c3aed",
      action: "Dealer markazi",
    },
    {
      key: "signals",
      title: "Bildirishnoma markazi",
      text: "Narx tushishi, booking statusi va sotuvchi javoblari bir qatlamda.",
      route: "/auto-market/notifications",
      tone: "#f59e0b",
      action: "Signal markazi",
    },
  ];
}

export function buildFinalDecisionRail(car = {}) {
  const inspection = Number(car.inspection_score || 72);
  const price = Number(car.price || 0);
  const median = Number(car.market_median_price || price || 0);
  const priceState = price && median
    ? price <= median ? "Bozor bilan mos yoki qulayroq" : "Bozor medianidan yuqoriroq"
    : "Narx tahlili tayyor";
  return [
    {
      key: "trust",
      title: "Ishonch",
      text: inspection >= 75 ? "Ko‘rik va sotuvchi signallari ijobiy." : "Ko‘rik tafsilotini chuqurroq tekshirish tavsiya qilinadi.",
      tone: inspection >= 75 ? "#16a34a" : "#f59e0b",
    },
    {
      key: "price",
      title: "Narx qarori",
      text: priceState,
      tone: price && median && price <= median ? "#2563eb" : "#ef4444",
    },
    {
      key: "action",
      title: "Keyingi qadam",
      text: "Booking, finance yoki dealer profile orqali qarorni yakunlang.",
      tone: "#7c3aed",
    },
  ];
}

export function buildSellerCommandCenter(items = []) {
  const active = items.filter((item) => item.status === "active").length;
  const sold = items.filter((item) => item.status === "sold").length;
  const archived = items.filter((item) => item.status === "archived").length;
  const totalViews = items.reduce((sum, item) => sum + Number(item.views_count || 0), 0);
  const totalCalls = items.reduce((sum, item) => sum + Number(item.calls_count || 0), 0);
  return [
    { key: "active", label: "Faol e’lonlar", value: String(active), route: "/auto-market/my-ads", tone: "#16a34a" },
    { key: "sold", label: "Sotilganlar", value: String(sold), route: "/auto-market/my-ads", tone: "#0ea5e9" },
    { key: "archived", label: "Arxiv", value: String(archived), route: "/auto-market/my-ads", tone: "#64748b" },
    { key: "views", label: "Jami ko‘rishlar", value: String(totalViews), route: "/auto-market/analytics", tone: "#7c3aed" },
    { key: "calls", label: "Qo‘ng‘iroqlar", value: String(totalCalls), route: "/auto-market/seller/leads", tone: "#f59e0b" },
    { key: "promote", label: "Premium paketlar", value: "VIP / Showroom", route: "/auto-market/promote/preview", tone: "#ef4444" },
  ];
}

export function buildNotificationRuleHealth(rules = [], items = []) {
  const high = rules.filter((item) => item.severity === "high").length;
  const medium = rules.filter((item) => item.severity !== "high").length;
  const unread = items.length;
  return [
    { key: "high", label: "Kritik rule", value: String(high), tone: "#ef4444" },
    { key: "medium", label: "Kuzatuv rule", value: String(medium), tone: "#2563eb" },
    { key: "signals", label: "Faol signallar", value: String(unread), tone: "#0f766e" },
  ];
}

export function buildFinanceActionDeck(car = {}) {
  const price = Number(car.price || 0);
  return [
    {
      key: "calculator",
      title: "Finance calculator",
      text: "Boshlang‘ich to‘lov va muddatni o‘zgartirib eng qulay rejani ko‘ring.",
      route: `/auto-market/finance-offers/${car?.id || "preview"}`,
      tone: "#ef4444",
    },
    {
      key: "checkout",
      title: "Booking checkout",
      text: "Bron, ko‘rik yoki premium xizmatni local payment orqali tasdiqlang.",
      route: `/auto-market/booking/${car?.id || "preview"}/checkout`,
      tone: "#0ea5e9",
    },
    {
      key: "history",
      title: "Narx tarixi",
      text: price ? "Narx harakatini ko‘rib finance qarorini mustahkamlang." : "Narx tarixini ko‘rib qaror qiling.",
      route: `/auto-market/price-history/${car?.id || "preview"}`,
      tone: "#7c3aed",
    },
  ];
}
