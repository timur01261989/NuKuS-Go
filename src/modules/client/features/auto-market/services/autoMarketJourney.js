import { curatedBodyTypeOptions } from "./autoMarketExperience";

export function buildFeedJourneyCards(filters = {}) {
  const activeCount = Object.values(filters || {}).filter((value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "boolean") return value;
    if (Array.isArray(value)) return value.length > 0;
    return String(value).trim() !== "";
  }).length;

  return [
    {
      key: "ready-search",
      title: activeCount > 2 ? "So‘rovingiz tayyor" : "Qidiruvni 3 bosishda tugating",
      text: activeCount > 2
        ? "Filtrlar ishlayapti. Endi narx, kuzov va diler holatini solishtiring."
        : "Marka, kuzov va narx oralig‘ini tanlab, eng mos e’lonlarni tez toping.",
      tone: "#0ea5e9",
    },
    {
      key: "verified-cars",
      title: "Ishonchli e’lonlarni ajrating",
      text: "VIN, tekshiruv, sotuvchi reytingi va narx signali bir oqimda ko‘rinadi.",
      tone: "#16a34a",
    },
    {
      key: "appointment",
      title: "Ko‘rish va bog‘lanishni cho‘zmang",
      text: "Qo‘ng‘iroq, yozishma va uchrashuv bandi bir joydan boshlanadi.",
      tone: "#f59e0b",
    },
  ];
}

export function buildFeedShortcuts() {
  return [
    { key: "dealer", label: "Faqat dilerlar", patch: { dealerOnly: true } },
    { key: "price-drop", label: "Narxi tushganlar", patch: { priceDropReady: true } },
    { key: "credit", label: "Bo‘lib to‘lash", patch: { kredit: true } },
    { key: "electric", label: "Elektro", patch: { fuel_type: "Elektro" } },
  ];
}

export function buildDetailConfidenceSteps(car = {}) {
  const score = Number(car?.inspection_score || 0);
  return [
    {
      key: "price",
      title: "Narx signali",
      text: car?.market_median_price ? "Bozor mediani bilan taqqoslab ko‘rilgan." : "Narx uchun bozor konteksti tayyorlangan.",
      state: "ready",
    },
    {
      key: "trust",
      title: "Tekshiruv ishonchi",
      text: score >= 80 ? "Texnik ko‘rinish kuchli." : score >= 65 ? "Ko‘rishdan oldin tekshiruvni ko‘ring." : "Qo‘shimcha tekshiruv tavsiya etiladi.",
      state: score >= 80 ? "good" : score >= 65 ? "warn" : "alert",
    },
    {
      key: "seller",
      title: "Sotuvchi bilan tez aloqa",
      text: "Qo‘ng‘iroq, chat va uchrashuv bandi tayyor.",
      state: "ready",
    },
  ];
}

export function buildSellerPostingChecklist(ad = {}) {
  const checks = [
    { key: "brand", label: "Marka va model", done: !!ad?.brand && !!ad?.model },
    { key: "specs", label: "Yil, yoqilg‘i, transmissiya", done: !!ad?.year && !!ad?.fuel_type && !!ad?.transmission },
    { key: "photos", label: "Kamida 8 ta sifatli rasm", done: Array.isArray(ad?.images) && ad.images.length >= 8 },
    { key: "price", label: "Aniq narx va sarlavha", done: !!ad?.price && !!String(ad?.title || "").trim() },
    { key: "contact", label: "Shahar va telefon", done: !!ad?.city && !!ad?.seller?.phone },
  ];
  return checks;
}

export function buildPhotoCoachNotes() {
  return [
    "Old, orqa va ikki yon tomonni to‘liq ko‘rsating.",
    "Diagonal rakurslar xaridorga kuzovni tez tushunishga yordam beradi.",
    "Salon, panel va bagajni albatta kiriting.",
    "Raqam va hujjat qismi alohida ravshan tushsin.",
  ];
}

export function buildProfessionalSellingPoints() {
  return [
    "Tasdiqlangan ko‘rinish xaridorni tezroq ishontiradi.",
    "Narx signali e’lonni bozor bilan bir tilda ko‘rsatadi.",
    "Foto rejasi past sifatli e’lonlardan ajratib turadi.",
  ];
}

export function buildBodyTypeEducation() {
  return curatedBodyTypeOptions.slice(0, 6).map((item) => ({
    key: item.key,
    title: item.label,
    asset: item.asset,
  }));
}
