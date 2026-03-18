import { formatCurrency } from "./priceUtils";
import { listSavedAlerts, listSavedSearches } from "./autoMarketBuyerCore";
import { listBookingEvents, buildBookingEventSummary } from "./autoMarketBookingCheckout";
import { listPaymentEvents, buildPaymentEventInsights } from "./autoMarketLocalPayments";

/**
 * Dealer sharhlarini shakllantirish.
 */
export function buildDealerReviews(seller = {}) {
  const reviews = [
    {
      key: "r1",
      author: "Azizbek",
      rating: 5,
      title: "Tez va aniq aloqa",
      text: "Ko‘rish vaqti tez belgilandi, hujjatlar oldindan tayyor edi.",
      date: "2 kun oldin",
      tag: "Test drive",
    },
    {
      key: "r2",
      author: "Madina",
      rating: 4,
      title: "Ishonchli showroom tajribasi",
      text: "Narx, ko‘rik va to‘lov bosqichlari tushunarli tushuntirildi.",
      date: "1 hafta oldin",
      tag: "Showroom",
    },
    {
      key: "r3",
      author: "Jahongir",
      rating: 5,
      title: "Hujjat va ko‘rik bo‘yicha toza jarayon",
      text: "VIN va ko‘rik ma’lumoti oldindan berildi, vaqt behuda ketmadi.",
      date: "3 hafta oldin",
      tag: "Ko‘rik",
    },
  ];

  const average = Number((reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length).toFixed(1));

  return {
    average,
    count: Number(seller.reviewCount || 138),
    highlights: [
      { key: "response", title: "Javob tezligi", value: seller.responseSpeed || "12 daqiqa" },
      { key: "completion", title: "Uchrashuv bajarilishi", value: ${seller.completionRate || 94}% },
      { key: "repeat", title: "Qayta xaridorlar", value: ${seller.repeatBuyers || 28}% },
    ],
    reviews,
  };
}

/**
 * Sotuvchi profilini yaratish (Trust Score mantiqi bilan).
 */
export function buildDealerTrustProfile(seller = {}) {
  const sold = Number(seller.soldCount || 24);
  const years = Number(seller.yearsOnPlatform || 3);
  const response = seller.responseSpeed || "15 daqiqa";
  const trust = Math.min(98, 72 + years * 4 + Math.round(sold / 10));
  
  const bookingSummary = buildBookingEventSummary(
    listBookingEvents().filter((item) => String(item.sellerId) === String(seller.id || "seller-main"))
  );
  
  const reviews = buildDealerReviews(seller);

  return {
    sellerName: seller.name  seller.seller_name  "Verified showroom",
    trust,
    response,
    sold,
    years,
    bookingSummary,
    reviewSummary: {
      average: reviews.average,
      count: reviews.count,
    },
    badges: [
      trust >= 90 ? "Verified dealer" : "Verified seller",
      response.includes("soat") ? "Ko‘rilgan javob" : "Tez javob",
      sold >= 20 ? "Ko‘p savdo" : "Ishonchli tarix",
      reviews.average >= 4.5 ? "Yuqori baho" : "Yaxshi baho",
    ],
    quickActions: [
      { key: "leads", title: "Leadlar markazi", text: "Booking va qiziqish oqimlarini kuzatish.", route: "/auto-market/seller/leads", tone: "#0ea5e9" },
      { key: "agenda", title: "Agenda", text: "Tasdiqlangan ko‘rish va test drive slotlari.", route: "/auto-market/seller/appointments", tone: "#8b5cf6" },
      { key: "alerts", title: "Bildirishnomalar", text: "Narx, booking va javob yangiliklari.", route: "/auto-market/notifications", tone: "#f59e0b" },
      { key: "rules", title: "Rule markazi", text: "Bildirishnoma qoidalarini boshqarish.", route: "/auto-market/notifications/rules", tone: "#ef4444" },
    ],
  };
}

/**
 * Avto-kredit kalkulyatori mantiqi.
 */
export function buildFinanceCalculator(car = {}, options = {}) {
  const price = Number(car.price || 285000000);
  const downPayment = Math.max(5000000, Number(options.downPayment || Math.round(price * 0.25)));
  const duration = Number(options.duration || 24);
  const annualRate = Number(options.annualRate || 26);
  const financed = Math.max(0, price - downPayment);
  const monthlyRate = annualRate / 12 / 100;
  
  const monthlyPayment = monthlyRate === 0
    ? financed / Math.max(1, duration)
    : (financed * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -duration));
  
  const total = Math.round(monthlyPayment * duration + downPayment);
    return {
    price,
    downPayment,
    duration,
    annualRate,
    financed,
    monthlyPayment: Math.round(monthlyPayment),
    total,
    summary: [
      { key: "price", title: "Avto narxi", value: formatCurrency(price) },
      { key: "down", title: "Boshlang‘ich to‘lov", value: formatCurrency(downPayment) },
      { key: "monthly", title: "Oyma-oy", value: formatCurrency(Math.round(monthlyPayment)) },
      { key: "total", title: "Umumiy to‘lov", value: formatCurrency(total) },
    ],
    durations: [12, 18, 24, 36].map((item) => ({ 
      key: String(item), 
      title: ${item} oy, 
      selected: item === duration 
    })),
    downPaymentOptions: [0.2, 0.25, 0.3, 0.4].map((share) => {
      const amount = Math.round(price * share);
      return { 
        key: String(share), 
        title: ${Math.round(share * 100)}%, 
        amount: formatCurrency(amount), 
        selected: amount === downPayment 
      };
    }),
  };
}

/**
 * Bo'lib to'lash takliflarini shakllantirish.
 */
export function buildFinanceOffers(car = {}) {
  const price = Number(car.price || 0);
  const baseDown = Math.max(5000000, Math.round(price * 0.2));
  const paymentEvents = listPaymentEvents();
  const paymentStats = buildPaymentEventInsights(paymentEvents);
  
  const calculator = buildFinanceCalculator(car, { 
    downPayment: Math.round(price * 0.25), 
    duration: 24, 
    annualRate: 26 
  });

  return [
    {
      key: "click-installment",
      title: "Click bo‘lib to‘lash",
      downPayment: formatCurrency(baseDown),
      monthly: formatCurrency(Math.round((price - baseDown) / 18 || 0)),
      duration: "18 oy",
      note: "Tezkor oldindan tasdiq va local checkout.",
      route: /auto-market/booking/${car?.id || "preview"}/checkout,
      tone: "#1d4ed8",
    },
    {
      key: "payme-plan",
      title: "Payme xarid rejasi",
      downPayment: formatCurrency(Math.round(baseDown * 1.1)),
      monthly: formatCurrency(Math.round((price - baseDown * 1.1) / 12 || 0)),
      duration: "12 oy",
      note: "Bron, ko‘rik va premium xizmatlar bilan bog‘lanadi.",
      route: /auto-market/booking/${car?.id || "preview"}/checkout,
      tone: "#0f766e",
    },
    {
      key: "humo-uzcard",
      title: "Humo / Uzcard to‘lov markazi",
      downPayment: formatCurrency(Math.round(baseDown * 0.8)),
      monthly: formatCurrency(Math.round((price - baseDown * 0.8) / 24 || 0)),
      duration: "24 oy",
      note: "Showroom va ko‘rish to‘lovlari uchun moslashuvchan usul.",
      route: /auto-market/booking/${car?.id || "preview"}/checkout,
      tone: "#7c3aed",
    },
    {
      key: "calculator-highlight",
      title: "Finance calculator tavsiyasi",
      downPayment: formatCurrency(calculator.downPayment),
      monthly: formatCurrency(calculator.monthlyPayment),
      duration: ${calculator.duration} oy,
      note: "Boshlang‘ich to‘lov va muddatni o‘zgartirib eng qulay rejani tanlang.",
      route: /auto-market/finance-offers/${car?.id || "preview"},
      tone: "#ef4444",
    },
    ...paymentStats.map((item) => ({
      key: item.key,
      title: item.title,
      downPayment: "—",
      monthly: String(item.value),
      duration: "Holat",
      note: item.text,
      route: "/auto-market/notifications",
      tone: "#f59e0b",
    })),
  ];
}

/**
 * Bildirishnoma qoidalari.
 */
export function buildNotificationRules() {
  return [
    {
      key: "price-drop",
      title: "Narx tushishi",
      text: "Saqlangan qidiruv va favoritlarda narx pasayganda bildirishnoma yuborish.",
      channel: "push + in-app",
      severity: "high",
      route: "/auto-market/saved-alerts",
    },
    {
      key: "seller-reply",
      title: "Sotuvchi javobi",
      text: "Chat, qo‘ng‘iroq yoki booking tasdig‘i kelganda darhol xabar berish.",
      channel: "in-app",
      severity: "medium",
      route: "/auto-market/seller/leads",
    },
    {
      key: "booking-status",
      title: "Booking holati",
      text: "Tasdiq, qayta rejalash yoki bekor qilish bo‘yicha statuslarni kuzatish.",
      channel: "push + sms-ready",
      severity: "high",
      route: "/auto-market/seller/appointments",
    },
    {
      key: "finance-update",
      title: "Finance yangiliklari",
      text: "Oyma-oy to‘lov, down payment va checkout tavsiyalari o‘zgarganda ko‘rsatish.",
      channel: "in-app",
      severity: "medium",
      route: "/auto-market/finance-offers/preview",
    },
    {
      key: "inspection-ready",
      title: "Ko‘rik tayyorligi",
      text: "VIN, ko‘rik yoki hujjat tayyor bo‘lganda ogohlantirish.",
      channel: "push + in-app",
      severity: "medium",
      route: "/auto-market/booking/preview/receipt?status=confirmed",
    },
  ];
}

/**
 * Avtobozor bildirishnomalari generatori.
 */
export function buildAutoMarketNotifications(seed = {}) {
  const alerts = seed.alerts?.length ? seed.alerts : listSavedAlerts();
  const searches = listSavedSearches();
  const bookings = listBookingEvents();
  const payments = listPaymentEvents();
  const rules = buildNotificationRules();

  const items = [
    ...alerts.slice(0, 4).map((item, index) => ({
      key: alert-${item.id || index},
      title: "Alert faollashgan",
      text: ${item.label || "Qidiruv"} uchun yangi mos e’lonlarni kuzatish yoqilgan.,
      tone: "#16a34a",
      route: "/auto-market/saved-alerts",
      category: "alert",
    })),
    ...bookings.slice(0, 4).map((item) => ({
      key: item.key,
      title: item.status === "confirmed" ? "Booking tasdiqlandi" : "Booking yangilandi",
      text: ${item.vehicle} · ${item.appointmentLabel} · ${item.provider.toUpperCase()}.,
      tone: item.status === "confirmed" ? "#16a34a" : "#f59e0b",
      route: /auto-market/booking/${item.adId}/receipt?day=${item.day}&slot=${item.slot}&provider=${item.provider}&service=${item.service}&status=${item.status},
      category: "booking",
    })),
    ...payments.slice(0, 4).map((item) => ({
      key: item.key,
      title: item.status === "paid" || item.status === "confirmed" ? "To‘lov muvaffaqiyatli" : "To‘lov kutilmoqda",
      text: ${item.vehicle} · ${item.provider.toUpperCase()} orqali ${formatCurrency(item.amount || 0)}.,
      tone: item.status === "paid" || item.status === "confirmed" ? "#16a34a" : "#2563eb",
      route: /auto-market/booking/${item.adId}/receipt?provider=${item.provider}&service=${item.service}&status=${item.status},
      category: "payment",
    })),
    ...searches.slice(0, 2).map((item) => ({
      key: item.id,
      title: "Saqlangan qidiruv tayyor",
      text: ${item.label} qidiruvini bir bosishda qayta ochish mumkin.,
      tone: "#7c3aed",
      route: "/auto-market/saved-searches",
      category: "search",
    })),
    ...rules.slice(0, 2).map((item) => ({
      key: rule-${item.key},
      title: ${item.title} qoidasi,
      text: item.text,
      tone: "#ef4444",
      route: "/auto-market/notifications/rules",
      category: "rule",
    })),
  ];

  if (!items.length) {
    return [
      { key: "price-drop", title: "Narx tushdi", text: "Saqlangan Malibu 2 uchun narx yangilandi.", tone: "#16a34a", route: "/auto-market/saved-alerts", category: "alert" },
      { key: "seller-replied", title: "Sotuvchi javob berdi", text: "Ko‘rish vaqti bo‘yicha javob tayyor.", tone: "#2563eb", route: "/auto-market/seller/leads", category: "lead" },
      { key: "booking-confirmed", title: "Booking tasdiqlandi", text: "Uchrashuv payshanba 16:00 ga belgilandi.", tone: "#f59e0b", route: "/auto-market/seller/appointments", category: "booking" },
      { key: "inspection-ready", title: "Ko‘rik tayyor", text: "Inspection report ko‘rishga tayyor bo‘ldi.", tone: "#7c3aed", route: "/auto-market/booking/preview/checkout", category: "inspection" },
    ];
  }

  return items;
}
  /**
 * Narx o'zgarishi tarixi.
 */
export function buildPriceHistorySummary(car = {}) {
  const price = Number(car.price || 0);
  const anchor = price || 100000000;
  
  const points = [1.06, 1.02, 1, 0.98, 0.96].map((m, idx) => ({
    key: p-${idx},
    label: ["5 oy oldin", "4 oy oldin", "3 oy oldin", "1 oy oldin", "Hozir"][idx],
    value: Math.round(anchor * m),
  }));

  const current = points[points.length - 1].value;
  const first = points[0].value;
  const diff = current - first;

  return {
    points,
    summary: diff < 0 ? "Narx pasaygan" : diff > 0 ? "Narx oshgan" : "Narx barqaror",
    deltaText: formatCurrency(Math.abs(diff)),
    nextBestActions: [
      { key: "alert", title: "Narx alerti yoqish", route: "/auto-market/saved-alerts" },
      { key: "finance", title: "Finance offers ko‘rish", route: /auto-market/finance-offers/${car?.id || "preview"} },
      { key: "booking", title: "Ko‘rishga yozilish", route: /auto-market/booking/${car?.id || "preview"}/checkout },
    ],
  };
}