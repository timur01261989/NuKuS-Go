const LOCAL_PAYMENT_PROVIDERS = [
  { key: "click", title: "Click", accent: "#1d4ed8", text: "Tez bron va xizmat to‘lovlari uchun." },
  { key: "payme", title: "Payme", accent: "#0f766e", text: "Bir bosishda to‘lovni yakunlash uchun." },
  { key: "humo", title: "Humo", accent: "#7c3aed", text: "Mahalliy karta bilan xavfsiz to‘lov." },
  { key: "uzcard", title: "Uzcard", accent: "#f59e0b", text: "Seller xizmatlari va premium paketlar uchun." },
];

export function getLocalPaymentProviders() {
  return LOCAL_PAYMENT_PROVIDERS;
}

export function buildLocalPaymentPlan(ad = {}, options = {}) {
  const price = Number(ad?.price || 0);
  const reservationBase = options?.reservationBase ?? 50000;
  const premiumPlacementFee = Math.max(90000, Math.min(Math.round(price * 0.002), 250000));
  const vinReportFee = 39000;
  const inspectionFee = 99000;

  return [
    {
      key: "reservation",
      title: "Bron to‘lovi",
      amount: reservationBase,
      subtitle: "Mashina vaqtincha ushlab turiladi",
      providers: ["click", "payme", "humo", "uzcard"],
      tone: "#0ea5e9",
    },
    {
      key: "vin",
      title: "VIN hisobot",
      amount: vinReportFee,
      subtitle: "Tarix va tekshiruv ma’lumotlarini ochish",
      providers: ["click", "payme"],
      tone: "#8b5cf6",
    },
    {
      key: "inspection",
      title: "Ko‘rik xizmati",
      amount: inspectionFee,
      subtitle: "Ekspert ko‘rigi va tavsiya",
      providers: ["click", "payme", "uzcard"],
      tone: "#10b981",
    },
    {
      key: "premium",
      title: "Premium e’lon xizmati",
      amount: premiumPlacementFee,
      subtitle: "Seller uchun VIP ko‘rinish va tezroq savdo",
      providers: ["click", "payme", "humo", "uzcard"],
      tone: "#f59e0b",
    },
  ];
}

export function buildLocalPaymentSummary(ad = {}) {
  return {
    title: "Mahalliy to‘lov markazi",
    text: "Bron, VIN, ko‘rik va premium xizmatlar mahalliy to‘lovlar orqali yakunlanadi.",
    providers: getLocalPaymentProviders(),
    plan: buildLocalPaymentPlan(ad),
  };
}


export function buildPaymentStatusTimeline(status = "pending", provider = "click") {
  const providerLabel = getLocalPaymentProviders().find((item) => item.key === provider)?.title || provider;
  return [
    { key: "checkout", title: "Checkout yakunlandi", text: "Booking, slot va xizmat tanlandi.", state: "Tayyor", tone: "#0ea5e9" },
    { key: "provider", title: "Provider tayyor", text: `${providerLabel} orqali tasdiqlash oynasi ochiladi.`, state: providerLabel, tone: "#8b5cf6" },
    {
      key: "status",
      title: status === "paid" ? "To‘lov muvaffaqiyatli" : status === "failed" ? "To‘lov qayta urinishda" : "To‘lov tasdiqlanishi kutilmoqda",
      text: status === "paid"
        ? "Receipt yaratildi, booking seller agenda’ga tushdi."
        : status === "failed"
          ? "Retry variantlari va boshqa provider orqali qayta urinish mumkin."
          : "Seller tasdiqlashi va provider callbacki bilan holat yangilanadi.",
      state: status === "paid" ? "Paid" : status === "failed" ? "Retry" : "Pending",
      tone: status === "paid" ? "#10b981" : status === "failed" ? "#ef4444" : "#f59e0b",
    },
  ];
}

export function buildPaymentReceipt(ad = {}, options = {}) {
  const provider = getLocalPaymentProviders().find((item) => item.key === options?.provider) || getLocalPaymentProviders()[0];
  const status = options?.status || "pending";
  const amount = buildLocalPaymentPlan(ad).find((item) => item.key === (options?.service || "reservation"))?.amount || 50000;
  return {
    title: "Mahalliy to‘lov receipt",
    text: `${ad?.brand || "Auto"} ${ad?.model || ""}`.trim() + " bo‘yicha booking va xizmat holati shu receipt’da ko‘rinadi.",
    statusLabel: status === "paid" ? "To‘landi" : status === "failed" ? "Qayta urinish" : "Tasdiqlanishi kutilmoqda",
    lines: [
      { key: "provider", label: "Provider", value: provider.title, text: provider.text },
      { key: "amount", label: "To‘lov summasi", value: `${amount.toLocaleString("ru-RU")} so‘m`, text: "Booking yoki tanlangan xizmat uchun." },
      { key: "policy", label: "Receipt holati", value: status === "paid" ? "Yakunlandi" : "Jarayonda", text: "Retry va receipt qayta ochish imkoniyati mavjud." },
    ],
  };
}

export function buildPaymentRetryOptions(activeProvider = "click") {
  return getLocalPaymentProviders()
    .filter((item) => item.key !== activeProvider)
    .map((item) => ({
      key: item.key,
      title: `${item.title} orqali qayta urinish`,
      text: "Agar birinchi urinish yakunlanmasa, boshqa mahalliy provider bilan tasdiqlash mumkin.",
      tone: item.accent,
    }));
}


const PAYMENT_EVENT_KEY = "auto_market_payment_events_v1";

function readPaymentEvents() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PAYMENT_EVENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePaymentEvents(items) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PAYMENT_EVENT_KEY, JSON.stringify(items));
  } catch {}
}

export function savePaymentEvent(ad = {}, state = {}) {
  const entry = {
    key: `payment-${ad?.id || "auto"}-${Date.now()}`,
    adId: ad?.id || "auto",
    vehicle: `${ad?.brand || "Auto"} ${ad?.model || "Listing"}`.trim(),
    provider: state?.provider || "click",
    service: state?.service || "reservation",
    status: state?.status || "pending",
    amount: Number(state?.amount || 0),
    createdAt: new Date().toISOString(),
  };
  writePaymentEvents([entry, ...readPaymentEvents()].slice(0, 24));
  return entry;
}

export function listPaymentEvents() {
  return readPaymentEvents();
}

export function buildPaymentEventInsights(events = []) {
  const safe = Array.isArray(events) ? events : [];
  return [
    { key: "payments-all", title: "To‘lov urinishlari", value: safe.length, text: "Booking, VIN va ko‘rik oqimlari shu yerda jamlanadi." },
    { key: "payments-pending", title: "Kutilayotgan", value: safe.filter((item) => item.status === "pending").length, text: "Retry yoki seller tasdig‘i kutilayotganlar." },
    { key: "payments-paid", title: "To‘langan", value: safe.filter((item) => item.status === "paid" || item.status === "confirmed").length, text: "Receipt tayyor bo‘lgan successful to‘lovlar." },
  ];
}
