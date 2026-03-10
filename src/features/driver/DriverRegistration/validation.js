import { DRIVER_DOCUMENT_FIELDS } from "./uploadConfig";

export function validatePersonalStep(data) {
  if (!String(data.lastName || "").trim()) return "Familiya kiritilmadi";
  if (!String(data.firstName || "").trim()) return "Ism kiritilmadi";
  if (!String(data.phone || "").trim()) return "Telefon kiritilmadi";
  if (!String(data.passportNumber || "").trim()) return "Pasport raqami kiritilmadi";
  return null;
}

export function validateVehicleStep(data) {
  if (!String(data.vehicleType || "").trim()) return "Transport turi tanlanmadi";
  if (!String(data.brand || "").trim()) return "Mashina markasi kiritilmadi";
  if (!String(data.model || "").trim()) return "Mashina modeli kiritilmadi";
  if (!String(data.plateNumber || "").trim()) return "Davlat raqami kiritilmadi";
  return null;
}

export function validateDocumentsStep(files = {}, previews = {}) {
  for (const field of DRIVER_DOCUMENT_FIELDS) {
    if (!field.required) continue;
    if (!files[field.key] && !previews[field.key]) {
      return `${field.label} kerak`;
    }
  }
  return null;
}
