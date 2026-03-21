import { autoMarketExtendedAssets, bodyColorVisuals, extendedBodyTypeVisuals } from "@/assets/auto-market/extended/index.js";

export function buildExtendedBodyTypeOptions() {
  return [
    { key: "kei-box", label: "Kichik box", filterValue: "Minivan", asset: extendedBodyTypeVisuals["kei-box"] },
    { key: "kei-sedan", label: "Kichik sedan", filterValue: "Sedan", asset: extendedBodyTypeVisuals["kei-sedan"] },
    { key: "kei-suv", label: "Kichik SUV", filterValue: "SUV", asset: extendedBodyTypeVisuals["kei-suv"] },
    { key: "kei-tall", label: "Kichik tall", filterValue: "Minivan", asset: extendedBodyTypeVisuals["kei-tall"] },
    { key: "kei-super-tall", label: "Kichik super tall", filterValue: "Minivan", asset: extendedBodyTypeVisuals["kei-super-tall"] },
    { key: "kei-sport", label: "Kichik sport", filterValue: "Coupe", asset: extendedBodyTypeVisuals["kei-sport"] },
    { key: "compact", label: "Compact", filterValue: "Hatchback", asset: extendedBodyTypeVisuals["compact"] },
    { key: "coupe", label: "Coupe", filterValue: "Coupe", asset: extendedBodyTypeVisuals["coupe"] },
    { key: "station-wagon", label: "Universal", filterValue: "Universal", asset: extendedBodyTypeVisuals["station-wagon"] },
    { key: "minivan-family", label: "Family van", filterValue: "Minivan", asset: extendedBodyTypeVisuals["minivan-family"] },
    { key: "camper", label: "Camper", filterValue: "Minivan", asset: extendedBodyTypeVisuals["camper"] },
    { key: "commercial", label: "Commercial", filterValue: "Pickup", asset: extendedBodyTypeVisuals["commercial"] },
    { key: "mini-utility", label: "Utility", filterValue: "Pickup", asset: extendedBodyTypeVisuals["mini-utility"] },
    { key: "service-bus", label: "Servis bus", filterValue: "Minivan", asset: extendedBodyTypeVisuals["service-bus"] },
    { key: "suv-compact", label: "Compact SUV", filterValue: "SUV", asset: extendedBodyTypeVisuals["suv-compact"] },
    { key: "suv-mid", label: "Mid SUV", filterValue: "SUV", asset: extendedBodyTypeVisuals["suv-mid"] },
    { key: "suv-large", label: "Large SUV", filterValue: "SUV", asset: extendedBodyTypeVisuals["suv-large"] },
    { key: "ev", label: "Elektro", filterValue: "SUV", asset: extendedBodyTypeVisuals["ev"] },
    { key: "hybrid", label: "Gibrid", filterValue: "Sedan", asset: extendedBodyTypeVisuals["hybrid"] },
    { key: "phev", label: "PHEV", filterValue: "SUV", asset: extendedBodyTypeVisuals["phev"] },
    { key: "support-access", label: "Maxsus", filterValue: "Universal", asset: extendedBodyTypeVisuals["support-access"] },
  ];
}

export function buildBodyColorOptions() {
  return [
    { key: "white", label: "Oq" },
    { key: "black", label: "Qora" },
    { key: "gray", label: "Kulrang" },
    { key: "blue", label: "Ko'k" },
    { key: "red", label: "Qizil" },
    { key: "green", label: "Yashil" },
    { key: "yellow", label: "Sariq" },
    { key: "beige", label: "Bej" },
    { key: "twoTone", label: "Ikki rang", asset: bodyColorVisuals.twoTone },
    { key: "other", label: "Boshqa", asset: bodyColorVisuals.other },
  ];
}

export function buildDealerTierProfile(seller = {}) {
  const response = Number(seller.response_rate ?? seller.responseRate ?? 88);
  const reviews = Number(seller.review_count ?? seller.reviewCount ?? 24);
  const inventory = Number(seller.inventory_count ?? seller.inventoryCount ?? 12);
  const soldCount = Number(seller.sold_count ?? seller.soldCount ?? 18);
  const score = response * 0.42 + Math.min(reviews, 80) * 0.45 + Math.min(inventory, 40) * 0.25 + Math.min(soldCount, 80) * 0.18;
  if (score >= 95) return { key: "showroom-elite", title: "Showroom Elite", tone: "#7c3aed", note: "Yuqori ishonch, ko‘p ijobiy review va faol inventar" };
  if (score >= 78) return { key: "dealer-plus", title: "Dealer Plus", tone: "#2563eb", note: "Faol sotuvchi va qayta xarid signallari yuqori" };
  return { key: "verified", title: "Verified", tone: "#16a34a", note: "Asosiy ishonch tekshiruvlaridan o‘tgan" };
}

export function buildDealerTierLadder(seller = {}) {
  const active = buildDealerTierProfile(seller).key;
  return [
    { key: "verified", title: "Verified", note: "Asosiy tekshiruv va javob intizomi", active: active === "verified", tone: "#16a34a" },
    { key: "dealer-plus", title: "Dealer Plus", note: "Ko‘proq review, inventar va response signal", active: active === "dealer-plus", tone: "#2563eb" },
    { key: "showroom-elite", title: "Showroom Elite", note: "Yuqori baho, qayta xaridor va showroom daraja", active: active === "showroom-elite", tone: "#7c3aed" },
  ];
}

export function buildWarrantyReservationSignals(car = {}) {
  const fuel = String(car.fuel_type || car.fuel || "").toLowerCase();
  const price = Number(car.price || 0);
  const evLike = fuel.includes("elektro") || fuel.includes("gibrid");
  return [
    {
      key: "reservation",
      title: price > 0 ? "Bron ochiq" : "Narx aniqlanmoqda",
      note: price > 0 ? "Ko‘rish yoki test drive uchun vaqtni band qilish mumkin" : "Sotuvchi bilan narxni tasdiqlang",
      accent: price > 0 ? "#2563eb" : "#f59e0b",
      cta: "Bron qilish",
      status: price > 0 ? "available" : "pending",
    },
    {
      key: "warranty",
      title: evLike ? "Batareya kafolati tekshiruvi" : "Hujjat va servis kafolati",
      note: evLike ? "EV batareya holati va qoldiq kafolatni tekshirish tavsiya etiladi" : "Servis tarixi va hujjatlar bir joyda tekshiriladi",
      accent: "#16a34a",
      cta: "Ko‘rish",
      status: "available",
    },
    {
      key: "inspection",
      title: "Ko‘rik sertifikati",
      note: "Mustaqil ko‘rik xulosasi va sertifikat ko‘rinishi xarid qarorini tezlashtiradi.",
      accent: "#7c3aed",
      cta: "Hisobot",
      status: "trusted",
    },
  ];
}

export function buildVinInsightCard(car = {}) {
  return {
    title: "VIN va tarix signali",
    note: car?.vin ? "VIN mavjud — tarix, ehtiyot qism va egalik izini tez tekshirish mumkin." : "VIN ko‘rsatilmagan. Sotuvchidan so‘rab, tarixni tekshirish tavsiya etiladi.",
    asset: autoMarketExtendedAssets.signal_vin_deep || autoMarketExtendedAssets.signal_vin_tip,
  };
}

export function buildInspectionCertificateCard(car = {}) {
  return {
    title: "Ko‘rik va sertifikat",
    note: car?.service_book ? "Servis tarixi mavjud. Sertifikatli ko‘rik bilan qarorni tez yopish mumkin." : "Ko‘rik sertifikati bilan kuzov, salon va yurish holatini bitta hisobotga yig‘ing.",
    image: autoMarketExtendedAssets.inspection_certificate,
    badge: "Trusted check",
    icon: autoMarketExtendedAssets.inspection_title,
  };
}

export function buildFavoritesEmptyState() {
  return {
    title: "Saqlanganlar hali bo‘sh",
    note: "Qiziqqan mashinalarni saqlang, bron va narx signalini bir joyda kuzating.",
    image: autoMarketExtendedAssets.state_favorites_guidance || autoMarketExtendedAssets.state_favorites_empty,
    ctaImage: autoMarketExtendedAssets.state_reservation_cta,
  };
}

export function buildNotificationSignalDeck(items = []) {
  return [
    {
      key: "alerts",
      title: "Narx va javob signalari",
      note: items.length ? "Aktiv signal markazi xaridorga eng muhim hodisalarni ko‘rsatmoqda." : "Signal markazini yoqing, narx tushishi va javoblarni boy bermaysiz.",
      asset: autoMarketExtendedAssets.signal_alert_boost || autoMarketExtendedAssets.signal_market_alert,
    },
    {
      key: "ev",
      title: "EV va zamonaviy model signalari",
      note: "Elektro va gibrid e’lonlar uchun alohida kuzatuv qoidalarini yoqish mumkin.",
      asset: autoMarketExtendedAssets.signal_ev_deep || autoMarketExtendedAssets.signal_ev,
    },
    {
      key: "price-drop",
      title: "Narx tushishi va VIN eslatmalari",
      note: "Narx harakati va VIN-topilmalarni bitta oqimga yig‘ib ko‘rsatish foydalanuvchiga tez qaror qildirishga yordam beradi.",
      asset: autoMarketExtendedAssets.signal_price_drop,
    },
  ];
}

export function buildFilterAssistVisual() {
  return {
    title: "Tezkor filter qidiruvi",
    note: "Brend, kuzov yoki rangni tez topish uchun filter ichida qidiruv signalidan foydalaning.",
    asset: autoMarketExtendedAssets.filter_search_deep || autoMarketExtendedAssets.filter_search,
  };
}

export function buildExtendedBrowseCards() {
  return [
    {
      key: "body-overview",
      title: "Kuzov bo‘yicha tanlang",
      note: "Sedan, SUV, family van yoki utility turini tez ajrating.",
      asset: autoMarketExtendedAssets.signal_body_type_overview,
    },
    {
      key: "ev-signal",
      title: "EV va gibridlarni ajrating",
      note: "Elektro va gibrid e’lonlar uchun alohida tezkor signal qatlamlari mavjud.",
      asset: autoMarketExtendedAssets.signal_ev_deep || autoMarketExtendedAssets.signal_ev,
    },
    {
      key: "price-drop",
      title: "Narx tushishini kuzating",
      note: "Price-drop va VIN tip signalini saved alerts bilan bog‘lab ishlatish mumkin.",
      asset: autoMarketExtendedAssets.signal_price_drop,
    },
  ];
}


export function buildSearchHoldGuidance(filters = {}) {
  const focus = filters?.brand || filters?.body_type || filters?.q || "mos variant";
  return [
    {
      key: "hold-search",
      title: "Qidiruvni ushlab turish",
      note: `“${focus}” bo‘yicha qidiruvni saqlang va yangi e’lon yoki narx o‘zgarishini kuting.`,
      asset: autoMarketExtendedAssets.signal_filter_search_market || autoMarketExtendedAssets.filter_search_deep || autoMarketExtendedAssets.filter_search,
    },
    {
      key: "calendar-watch",
      title: "Rezerv va ko‘rish navbati",
      note: "Band qilish ochilganda yoki sotuvchi vaqt tasdiqlaganda sizga darrov signal tushadi.",
      asset: autoMarketExtendedAssets.state_reservation_cta,
    },
  ];
}

export function buildWarrantyBadgeSet(car = {}) {
  const electric = String(car?.fuel_type || car?.fuel || "").toLowerCase().includes("elektro");
  return [
    {
      key: "docs",
      title: "Hujjatlar tayyor",
      note: "Servis tarixi, egalik va rasmiy hujjatlar bir joyda tekshiriladi.",
      asset: autoMarketExtendedAssets.inspection_icon || autoMarketExtendedAssets.inspection_title,
      state: "verified",
    },
    {
      key: "warranty",
      title: electric ? "Batareya kafolati" : "Kafolat va servis",
      note: electric ? "Batareya sog‘ligi va qoldiq kafolat alohida ko‘riladi." : "Kafolat qamrovi va servis holatini oldindan ko‘ring.",
      asset: autoMarketExtendedAssets.signal_ev_market || autoMarketExtendedAssets.signal_ev_deep || autoMarketExtendedAssets.signal_ev,
      state: electric ? "ev" : "service",
    },
  ];
}

export function buildReservationReadinessStates(car = {}) {
  const price = Number(car?.price || 0);
  return [
    {
      key: "available",
      title: price > 0 ? "Rezervga tayyor" : "Narx tasdig‘i kutilmoqda",
      note: price > 0 ? "Ko‘rish va test drive slotlari uchun bron ochiq." : "Sotuvchi narxni yangilashi bilan bron ochiladi.",
      asset: autoMarketExtendedAssets.state_reservation_cta,
      cta: price > 0 ? "Bronni boshlash" : "Narxni kuzatish",
    },
    {
      key: "contact",
      title: "Tez aloqa yo‘li",
      note: "Seller bilan qo‘ng‘iroq yoki chat orqali vaqtni tez tasdiqlash mumkin.",
      asset: autoMarketExtendedAssets.state_contact_cta || autoMarketExtendedAssets.state_call_cta,
      cta: "Aloqaga chiqish",
    },
  ];
}

export function buildDealerTierBenefits(seller = {}) {
  const tier = buildDealerTierProfile(seller);
  const common = [
    "Javob tezligi va e’lon faolligi ko‘rinadi",
    "Ko‘rish va booking oqimi seller paneliga tushadi",
  ];
  if (tier.key === "showroom-elite") {
    return [...common, "Ko‘proq review va yuqori ishonch", "Premium showroom xizmatlari ochiq"];
  }
  if (tier.key === "dealer-plus") {
    return [...common, "Barqaror review va inventar boshqaruvi", "Kuchli seller signal qatlamlari"];
  }
  return [...common, "Asosiy verifikatsiya va booking tayyorligi"];
}

export function buildResidualSignalRail(car = {}) {
  return [
    {
      key: "price-up-down",
      title: "Narx yo‘nalishi",
      note: "Narx tushishi yoki ko‘tarilishi saved alerts markaziga ulanadi.",
      asset: Number(car?.price || 0) > 300000000 ? autoMarketExtendedAssets.signal_price_allow_down : autoMarketExtendedAssets.signal_price_allow_up,
    },
    {
      key: "body-overview",
      title: "Kuzov bo‘yicha tez tanlov",
      note: "Body type browse rasmlari yangi foydalanuvchi uchun tanlashni osonlashtiradi.",
      asset: autoMarketExtendedAssets.signal_body_overview_2 || autoMarketExtendedAssets.signal_body_type_overview,
    },
  ];
}


export function buildQrAssistCards(car = {}) {
  const vinKnown = Boolean(car?.vin);
  return [
    {
      key: "qr-share",
      title: "QR orqali ulashish",
      note: "Ko‘rish, bron yoki seller uchrashuvi havolasini QR bilan tez yuborish mumkin.",
      asset: autoMarketExtendedAssets.signal_qr_entry,
    },
    {
      key: "barcode-vin",
      title: vinKnown ? "VIN tez tekshiruvi" : "VIN so‘rash tavsiyasi",
      note: vinKnown ? "VIN mavjud bo‘lsa, tezkor tekshiruv va servis mosligini ochish osonlashadi." : "VIN ko‘rsatilmagan bo‘lsa, sotuvchidan so‘rab keyin tekshiruvni davom ettiring.",
      asset: autoMarketExtendedAssets.signal_barcode_entry,
    },
  ];
}

export function buildCompareAssistRail(cars = []) {
  return [
    {
      key: "compare-focus",
      title: "Taqqoslashni soddalashtiring",
      note: cars.length > 1 ? "Narx, yurish va servis tayyorligini yonma-yon ko‘rib, eng qulay variantni tez ajrating." : "Kamida ikki variantni qo‘shsangiz, taqqoslash bo‘yicha tavsiya chiqadi.",
      asset: autoMarketExtendedAssets.signal_compare_assist,
    },
    {
      key: "deal-signal",
      title: "Narx va VIN signalini birga ko‘ring",
      note: "Price-drop va VIN-tip qatlamini compare qarori bilan birga ishlatish tavsiya etiladi.",
      asset: autoMarketExtendedAssets.signal_price_drop_alt || autoMarketExtendedAssets.signal_price_drop,
    },
  ];
}

export function buildDealerActionTiles(seller = {}) {
  const tier = buildDealerTierProfile(seller);
  return [
    {
      key: "call-now",
      title: "Tez qo‘ng‘iroq",
      note: "Qisqa vaqt ichida ko‘rish yoki rezervni tasdiqlash uchun eng tez yo‘l.",
      asset: autoMarketExtendedAssets.state_call_action || autoMarketExtendedAssets.state_call_cta,
      tone: tier.tone,
    },
    {
      key: "contact-now",
      title: "Chat va aloqa",
      note: "Qo‘shimcha rasm, VIN yoki servis tarixini so‘rash uchun yozishmalarni oching.",
      asset: autoMarketExtendedAssets.state_contact_action || autoMarketExtendedAssets.state_contact_cta,
      tone: tier.tone,
    },
  ];
}

export function buildNotificationRuleBoosts(items = []) {
  return [
    {
      key: "market-alert",
      title: "Kuchaytirilgan alert qatlami",
      note: items.length ? "Signal markazi narx, bron va javob hodisalarini bitta oqimda jamlamoqda." : "Saved alerts va booking signalini yoqsangiz, muhim o‘zgarishlar boy berilmaydi.",
      asset: autoMarketExtendedAssets.signal_alert_market_2 || autoMarketExtendedAssets.signal_alert_boost,
    },
    {
      key: "search-route",
      title: "Filter qidiruvi va market yo‘riqnomasi",
      note: "Qidiruv ichidagi filter ikonlari va market signalari yangi foydalanuvchi uchun yo‘l ko‘rsatadi.",
      asset: autoMarketExtendedAssets.filter_search_ot || autoMarketExtendedAssets.signal_filter_search_market || autoMarketExtendedAssets.filter_search_deep,
    },
    {
      key: "ev-watch",
      title: "EV kuzatuv qoidalari",
      note: "Elektro va gibrid e’lonlar uchun alohida signal qoidalarini yoqish tavsiya etiladi.",
      asset: autoMarketExtendedAssets.signal_ev_europe || autoMarketExtendedAssets.signal_ev_market || autoMarketExtendedAssets.signal_ev_deep,
    },
  ];
}
