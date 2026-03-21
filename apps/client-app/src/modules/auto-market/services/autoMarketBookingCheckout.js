
const PROVIDERS = [
  { key: "click", title: "Click", text: "Tez tasdiq va bron to‘lovi uchun.", tone: "#1d4ed8" },
  { key: "payme", title: "Payme", text: "Mobil checkout va qayta urinish uchun qulay.", tone: "#0f766e" },
  { key: "humo", title: "Humo", text: "Mahalliy karta bilan xavfsiz to‘lov.", tone: "#7c3aed" },
  { key: "uzcard", title: "Uzcard", text: "Inspection va premium xizmatlar uchun mos.", tone: "#f59e0b" },
];

export function getCheckoutProviders() {
  return PROVIDERS;
}

export function getBookingCalendar(ad = {}) {
  const city = ad?.city || "Toshkent";
  return [
    { key: "today", label: "Bugun", text: `${city} showroom`, slots: 3 },
    { key: "tomorrow", label: "Ertaga", text: "Ko‘proq vaqt tanlovi", slots: 4 },
    { key: "weekend", label: "Dam olish", text: "Oilaviy ko‘rish va test drive", slots: 2 },
  ];
}

export function getCheckoutSlotMap(ad = {}) {
  const reservationFee = Math.max(50000, Math.min(Math.round(Number(ad?.price || 0) * 0.003), 350000));
  return {
    today: [
      { key: "today-11", label: "11:00", note: "Tez ko‘rish va seller bilan tanishuv.", tone: "#0ea5e9", mode: "showroom", modeLabel: "Showroom", amount: reservationFee },
      { key: "today-16", label: "16:30", note: "Band vaqt. Narxni shu joyda gaplashish mumkin.", tone: "#10b981", mode: "test-drive", modeLabel: "Test drive", amount: reservationFee },
      { key: "today-19", label: "19:00", note: "Ishdan keyingi ko‘rish uchun qulay.", tone: "#8b5cf6", mode: "showroom", modeLabel: "Showroom", amount: reservationFee },
    ],
    tomorrow: [
      { key: "tomorrow-10", label: "10:00", note: "Ko‘rik va hujjatlarni birga ko‘rish.", tone: "#f59e0b", mode: "inspection", modeLabel: "Ko‘rik", amount: 99000 },
      { key: "tomorrow-14", label: "14:00", note: "Test drive va seller bilan hujjat suhbati.", tone: "#0ea5e9", mode: "test-drive", modeLabel: "Test drive", amount: reservationFee },
      { key: "tomorrow-18", label: "18:00", note: "Shahar ichida qisqa test marshruti mavjud.", tone: "#10b981", mode: "test-drive", modeLabel: "Test drive", amount: reservationFee },
    ],
    weekend: [
      { key: "weekend-12", label: "12:00", note: "Oilaviy ko‘rish va salonda taqqoslash.", tone: "#8b5cf6", mode: "showroom", modeLabel: "Showroom", amount: reservationFee },
      { key: "weekend-15", label: "15:30", note: "Video-inspection va kelishuv uchun kengroq vaqt.", tone: "#f59e0b", mode: "inspection", modeLabel: "Ko‘rik", amount: 99000 },
    ],
  };
}

export function getCheckoutServices() {
  return [
    { key: "reservation", title: "Bron qilish", text: "Mashina vaqtincha ushlab turiladi.", tone: "#0ea5e9" },
    { key: "inspection", title: "Ko‘rik xizmati", text: "Ekspert bilan ko‘rish va tavsiya.", tone: "#10b981" },
    { key: "vin", title: "VIN hisobot", text: "Tarix va tekshiruv ma’lumoti ochiladi.", tone: "#8b5cf6" },
  ];
}

export function buildBookingCheckout(ad = {}, options = {}) {
  const price = Number(ad?.price || 0);
  const service = options?.service || "reservation";
  const provider = options?.provider || "click";
  const day = options?.day || "today";
  const slot = options?.slot || "today-16";
  const allSlots = getCheckoutSlotMap(ad);
  const currentSlot = Object.values(allSlots).flat().find((item) => item.key === slot) || allSlots[day]?.[0];
  const selectedService = getCheckoutServices().find((item) => item.key === service) || getCheckoutServices()[0];
  const reservationFee = Math.max(50000, Math.min(Math.round(price * 0.003), 350000));
  const inspectionFee = 99000;
  const vinFee = 39000;
  const base = service === "inspection" ? inspectionFee : service === "vin" ? vinFee : currentSlot?.amount || reservationFee;
  const summary = [
    { key: "vehicle", label: "Avtomobil", value: `${ad?.brand || "Auto"} ${ad?.model || ""}`.trim() },
    { key: "day", label: "Kun", value: getBookingCalendar(ad).find((item) => item.key === day)?.label || "Bugun" },
    { key: "slot", label: "Vaqt", value: currentSlot?.label || "16:30" },
    { key: "service", label: "Xizmat", value: selectedService.title },
    { key: "provider", label: "To‘lov usuli", value: provider.toUpperCase() },
  ];
  const breakdown = [
    { key: "base", label: "Asosiy summa", amount: base, text: selectedService.text },
    { key: "platform", label: "Platforma haqi", amount: 0, text: "Hozircha alohida komissiya olinmaydi." },
    { key: "refund", label: "Qaytarish qoidasi", text: service === "reservation" ? "Seller tasdiqlamasa yoki slot bekor qilinsa qayta ko‘rib chiqiladi." : "Raqamli va ekspert xizmatlar qaytarilmaydi." },
  ];
  return {
    title: "Booking checkout",
    text: "Tanlangan kun, vaqt, xizmat va mahalliy to‘lov usuli shu yerda yakuniy tasdiqlanadi.",
    summary,
    breakdown,
    total: base,
    ctaLabel: "Tasdiqlash va lead yaratish",
    currentSlot,
  };
}

export function buildBookingSuccessNote(ad = {}) {
  return {
    title: "Booking tayyor",
    text: `${ad?.brand || "Avto"} ${ad?.model || ""}`.trim() + " bo‘yicha booking seller lead pipeline’iga tushadi va agenda’ga yoziladi.",
  };
}

export function buildCheckoutReceipt(ad = {}, options = {}) {
  const checkout = buildBookingCheckout(ad, options);
  return [
    { key: "status", label: "Holat", value: "Tasdiqlash kutilmoqda" },
    { key: "lead", label: "Seller lead", value: "Yaratiladi" },
    { key: "agenda", label: "Agenda", value: "Bugungi uchrashuvlarga qo‘shiladi" },
    { key: "amount", label: "Summa", value: `${checkout.total.toLocaleString("ru-RU")} so‘m` },
  ];
}


const BOOKING_EVENT_KEY = "auto_market_booking_events_v1";

function readEvents() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BOOKING_EVENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEvents(items) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BOOKING_EVENT_KEY, JSON.stringify(items));
  } catch {}
}

export function saveBookingEvent(ad = {}, state = {}) {
  const slotMap = getCheckoutSlotMap(ad);
  const slot = (slotMap[state?.day || "today"] || []).find((item) => item.key === state?.slot) || {};
  const entry = {
    key: `booking-${ad?.id || "auto"}-${Date.now()}`,
    adId: ad?.id || "auto",
    vehicle: `${ad?.brand || "Auto"} ${ad?.model || "Listing"}`.trim(),
    sellerId: ad?.seller?.id || ad?.seller_id || "seller-main",
    sellerName: ad?.seller?.name || ad?.seller_name || "Seller",
    day: state?.day || "today",
    slot: state?.slot || "today-16",
    slotLabel: slot.label || "16:30",
    appointmentLabel: `${slot.label || "16:30"} · ${slot.modeLabel || "Showroom"}`,
    provider: state?.provider || "click",
    service: state?.service || "reservation",
    amount: Number(slot.amount || 50000),
    status: state?.status || "pending",
    createdAt: new Date().toISOString(),
  };
  writeEvents([entry, ...readEvents()].slice(0, 24));
  return entry;
}

export function listBookingEvents() {
  return readEvents();
}

export function buildBookingEventSummary(events = []) {
  const safe = Array.isArray(events) ? events : [];
  return {
    total: safe.length,
    pending: safe.filter((item) => item.status === "pending").length,
    confirmed: safe.filter((item) => item.status === "confirmed").length,
    latest: safe[0] || null,
  };
}
