export function validateInspectionItems(items = []) {
  const errors = [];
  if (!items.length) errors.push("Kamida bitta inspection band bo‘lishi kerak");

  for (const item of items) {
    if (!item?.checkpointCode) errors.push("checkpointCode bo‘sh bo‘lishi mumkin emas");
    if (item?.severity != null && (item.severity < 0 || item.severity > 5)) {
      errors.push(`Severity noto‘g‘ri: ${item.checkpointCode || "unknown"}`);
    }
    if (item?.status === "critical" && !item?.comment) {
      errors.push(`Critical holat uchun izoh kerak: ${item.checkpointCode || "unknown"}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function summarizeInspection(items = []) {
  const safeItems = Array.isArray(items) ? items : [];
  const counts = { ok: 0, repair: 0, replace: 0, warning: 0, critical: 0, na: 0 };
  safeItems.forEach((item) => {
    const key = item?.status || "na";
    counts[key] = (counts[key] || 0) + 1;
  });

  const score = Math.max(
    0,
    100 - counts.replace * 18 - counts.critical * 24 - counts.warning * 8 - counts.repair * 10,
  );

  let verdict = "Yaxshi";
  if (score < 85) verdict = "Diqqat kerak";
  if (score < 70) verdict = "Tekshiruv talab";
  if (score < 55) verdict = "Xavf yuqori";

  return { counts, score, verdict };
}

export function buildInspectionItemsFromCar(car = {}) {
  const comfort = car?.comfort || {};
  return [
    { checkpointCode: "engine", label: "Dvigatel", status: comfort.abs ? "ok" : "warning", severity: comfort.abs ? 1 : 3 },
    { checkpointCode: "airbags", label: "Xavfsizlik yostiqlari", status: comfort.airbags ? "ok" : "warning", severity: comfort.airbags ? 1 : 4 },
    { checkpointCode: "body", label: "Kuzov va bo‘yoq", status: car?.bodyStatus === "replaced" ? "repair" : "ok", severity: car?.bodyStatus === "replaced" ? 3 : 1 },
    { checkpointCode: "sunroof", label: "Komfort jihozlari", status: comfort.sunroof ? "ok" : "na", severity: comfort.sunroof ? 1 : 0 },
  ];
}