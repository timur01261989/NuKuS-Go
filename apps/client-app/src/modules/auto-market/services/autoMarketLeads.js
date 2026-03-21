
const STAGES = [
  { key: "new", title: "Yangi", tone: "#0ea5e9" },
  { key: "contacted", title: "Aloqa qilindi", tone: "#8b5cf6" },
  { key: "scheduled", title: "Uchrashuv belgilandi", tone: "#10b981" },
  { key: "reserved", title: "Bron qilingan", tone: "#f59e0b" },
  { key: "negotiation", title: "Muzokara", tone: "#ef4444" },
  { key: "closed", title: "Yopildi", tone: "#334155" },
];

export function getLeadStages() {
  return STAGES;
}

export function buildSellerLeads(items = []) {
  const sourcePool = ["chat", "call", "favorite", "booking", "compare", "vin"];
  const names = ["Abdulloh", "Shahzod", "Aziza", "Javohir", "Madina", "Sardor", "Asal"];
  const safe = (items || []).slice(0, 10);
  const leads = safe.map((item, index) => {
    const stage = STAGES[index % STAGES.length];
    const source = sourcePool[index % sourcePool.length];
    const heat = index < 2 ? "hot" : index < 5 ? "warm" : "new";
    return {
      key: `lead-${item?.id || index}`,
      customer: names[index % names.length],
      vehicle: `${item?.brand || "Auto"} ${item?.model || "Listing"}`.trim(),
      source,
      stage: stage.key,
      stageTitle: stage.title,
      tone: stage.tone,
      heat,
      nextStep:
        stage.key === "new" ? "5 daqiqada qayta aloqa qiling" :
        stage.key === "contacted" ? "Slot taklif qiling" :
        stage.key === "scheduled" ? "Reminder yuboring" :
        stage.key === "reserved" ? "Bron va kelish vaqtini tasdiqlang" :
        stage.key === "negotiation" ? "Narx diapazonini yuboring" :
        "Natijani qayd eting",
      price: Number(item?.price || 0),
      sellerReplySla: index < 3 ? "15 min" : "1 soat",
      appointment: index < 4 ? "Ertaga 14:00" : "Rejalashtirilmagan",
    };
  });
  return leads.length ? leads : [{
    key: "lead-empty",
    customer: "Lead oqimi tayyor",
    vehicle: "Yangi qiziqishlar shu yerda ko‘rinadi",
    source: "system",
    stage: "new",
    stageTitle: "Yangi",
    tone: "#94a3b8",
    heat: "new",
    nextStep: "Booking va local payment leadlarni tezlashtiradi.",
    price: 0,
    sellerReplySla: "—",
    appointment: "—",
  }];
}

export function buildLeadsOverview(leads = []) {
  const stages = getLeadStages().map((stage) => ({
    key: stage.key,
    label: stage.title,
    value: leads.filter((lead) => lead.stage === stage.key).length,
    tone: stage.tone,
  }));
  return [
    { key: "all", label: "Jami lead", value: leads.length, tone: "#0f172a" },
    ...stages,
  ];
}

export function filterLeadsByStage(leads = [], stage = "all") {
  if (!stage || stage === "all") return leads;
  return leads.filter((lead) => lead.stage === stage);
}

export function buildLeadQuickActions(lead = {}) {
  return [
    { key: "call", title: "Qo‘ng‘iroq", text: "Tez kontakt va vaqtni tasdiqlash.", tone: "#0ea5e9" },
    { key: "chat", title: "Chat", text: "Narx, hujjat va joylashuvni yuborish.", tone: "#8b5cf6" },
    { key: "confirm", title: "Tasdiqlash", text: lead.stage === "reserved" ? "Bronni mustahkamlash." : "Keyingi qadamni belgilash.", tone: "#10b981" },
    { key: "reschedule", title: "Ko‘chirish", text: "Slotni boshqa vaqtga surish.", tone: "#f59e0b" },
  ];
}

export function buildLeadPipelineGuide() {
  return [
    { key: "new", title: "Yangi lead", text: "Eng muhim 5 daqiqa: birinchi javob tezligi.", tone: "#0ea5e9" },
    { key: "scheduled", title: "Uchrashuv", text: "Kalendarga tushirish va reminder yuborish.", tone: "#10b981" },
    { key: "negotiation", title: "Muzokara", text: "Narx diapazoni va trade-in shartlarini yuborish.", tone: "#ef4444" },
  ];
}


export function enrichLeadForCrm(lead = {}, index = 0) {
  const notes = [
    "Narx bo‘yicha savol berdi.",
    "Bugun kechqurun qo‘ng‘iroq kutmoqda.",
    "Booking checkoutni boshlagan, lekin tugatmagan.",
    "VIN va ko‘rik haqida qo‘shimcha ma’lumot so‘radi.",
  ];
  const followUps = ["5 daqiqada", "Bugun 18:00", "Ertaga 10:00", "Dam olish kuni"];
  return {
    ...lead,
    note: lead.note || notes[index % notes.length],
    followUpAt: lead.followUpAt || followUps[index % followUps.length],
  };
}
