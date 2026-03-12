import { DRIVER_DOCUMENT_FIELDS } from "./uploadConfig";

function hasEnabledService(serviceTypes = {}) {
  return ["city", "intercity", "interdistrict"].some((area) =>
    ["passenger", "delivery", "freight"].some(
      (type) => !!serviceTypes?.[area]?.[type]
    )
  );
}

export function validatePersonalStep(data) {
  const errors = {};
  if (!String(data.lastName || "").trim()) errors.lastName = "Familiya kiritilmadi";
  if (!String(data.firstName || "").trim()) errors.firstName = "Ism kiritilmadi";
  if (!String(data.phone || "").trim()) errors.phone = "Telefon kiritilmadi";
  if (String(data.phone || "").trim().length !== 9) errors.phone = "Telefon 9 ta raqam bo'lishi kerak";
  if (!String(data.passportNumber || "").trim()) errors.passportNumber = "Pasport raqami kiritilmadi";
  return errors;
}

export function validateVehicleStep(data) {
  const errors = {};
  if (!String(data.vehicleType || "").trim()) errors.vehicleType = "Transport turi tanlanmadi";
  if (!String(data.brand || "").trim()) errors.brand = "Mashina markasi kiritilmadi";
  if (!String(data.model || "").trim()) errors.model = "Mashina modeli kiritilmadi";
  if (!String(data.plateNumber || "").trim()) errors.plateNumber = "Davlat raqami kiritilmadi";
  if (data.seats === null || data.seats === undefined || data.seats === "") errors.seats = "O'rindiqlar soni kiritilmadi";
  if (data.cargoKg === null || data.cargoKg === undefined || data.cargoKg === "") errors.cargoKg = "Yuk sig'imi kiritilmadi";
  if (data.cargoM3 === null || data.cargoM3 === undefined || data.cargoM3 === "") errors.cargoM3 = "Yuk hajmi kiritilmadi";
  if (!hasEnabledService(data.serviceTypes)) errors.serviceTypes = "Kamida bitta xizmat turini yoqing";
  return errors;
}

export function validateDocumentsStep(files = {}, previews = {}) {
  const errors = {};
  for (const field of DRIVER_DOCUMENT_FIELDS) {
    if (!field.required) continue;
    if (!files[field.key] && !previews[field.key]) errors[field.key] = `${field.label} kerak`;
  }
  return errors;
}

export function hasStepErrors(errorMap) {
  return Object.keys(errorMap || {}).length > 0;
}
