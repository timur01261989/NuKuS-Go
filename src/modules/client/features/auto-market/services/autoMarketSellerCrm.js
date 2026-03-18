export function buildSellerCrmOverview(items = []) {
  const active = items.filter((item) => item?.status !== "archived").length;
  const archived = items.filter((item) => item?.status === "archived").length;
  const totalViews = items.reduce((sum, item) => sum + Number(item?.views || 0), 0);
  const hotLeads = items.reduce((sum, item) => sum + Math.max(1, Math.round(Number(item?.views || 0) / 18)), 0);
  return [
    { key: "active", title: "Faol e’lonlar", value: active, text: "Hozir xaridor ko‘rayotgan e’lonlar.", tone: "#0ea5e9" },
    { key: "leads", title: "Issiq leadlar", value: hotLeads, text: "Yaqin kunlarda qayta aloqa qilish kerak.", tone: "#10b981" },
    { key: "views", title: "Jami ko‘rishlar", value: totalViews, text: "Qaysi e’lon kuchli ishlayotganini ko‘rsatadi.", tone: "#8b5cf6" },
    { key: "archived", title: "Arxiv", value: archived, text: "Yakunlangan yoki vaqtincha to‘xtatilgan e’lonlar.", tone: "#f59e0b" },
  ];
}

export function buildSellerLeadPipeline(items = []) {
  const leads = items.slice(0, 4).map((item, index) => ({
    key: `lead-${item?.id || index}`,
    title: `${item?.brand || "Auto"} ${item?.model || "Listing"}`,
    stage: index === 0 ? "Yangi so‘rov" : index === 1 ? "Qo‘ng‘iroq kutilmoqda" : index === 2 ? "Ko‘rish band qilingan" : "Narx bo‘yicha muzokara",
    nextStep: index === 0 ? "5 daqiqada javob bering" : index === 1 ? "Telefonni tasdiqlang" : index === 2 ? "Uchrashuvni eslatma bilan tasdiqlang" : "Chegirma chegarasini belgilang",
    tone: index === 0 ? "#0ea5e9" : index === 1 ? "#8b5cf6" : index === 2 ? "#10b981" : "#f59e0b",
  }));
  return leads.length ? leads : [
    { key: "empty", title: "Leadlar tayyor", stage: "Hali yangi lead yo‘q", nextStep: "Premium listing va bron funksiyasi lead oqimini tezlatadi.", tone: "#94a3b8" }
  ];
}

export function buildSellerCrmAgenda(items = []) {
  return [
    { key: "a1", time: "Bugun 11:00", title: "Ko‘rish uchrashuvi", text: "Eng issiq lid uchun showroom uchrashuvi.", tone: "#0ea5e9" },
    { key: "a2", time: "Bugun 16:30", title: "Test drive", text: "Haydash va narx bo‘yicha yakuniy suhbat.", tone: "#10b981" },
    { key: "a3", time: "Ertaga 10:00", title: "Qayta aloqa", text: "Javobsiz qolgan lidga follow-up qilish.", tone: "#8b5cf6" },
  ];
}
