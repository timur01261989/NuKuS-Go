import { uploadSections } from "./uploadConfig";

export function validatePersonalStep(formData) {
  const errors = {};

  if (!String(formData.lastName || "").trim()) {
    errors.lastName = "Familiya kiritilmadi";
  }

  if (!String(formData.firstName || "").trim()) {
    errors.firstName = "Ism kiritilmadi";
  }

  if (!String(formData.phone || "").trim()) {
    errors.phone = "Telefon raqami kiritilmadi";
  } else if (String(formData.phone).length !== 9) {
    errors.phone = "Telefon 9 ta raqam bo'lishi kerak";
  }

  return errors;
}

export function validateVehicleStep(formData) {
  const errors = {};

  if (!String(formData.vehicleType || "").trim()) {
    errors.vehicleType = "Transport turi tanlanmadi";
  }

  if (!String(formData.brand || "").trim()) {
    errors.brand = "Mashina markasi kiritilmadi";
  }

  if (!String(formData.model || "").trim()) {
    errors.model = "Model kiritilmadi";
  }

  if (!String(formData.plateNumber || "").trim()) {
    errors.plateNumber = "Davlat raqami kiritilmadi";
  }

  return errors;
}

export function validateDocumentsStep(files) {
  const errors = {};

  for (const section of uploadSections) {
    for (const field of section.fields) {
      if (field.required && !files?.[field.key]) {
        errors[field.key] = `${field.label} yuklanmadi`;
      }
    }
  }

  return errors;
}

export function hasErrors(errorObject) {
  return Object.values(errorObject || {}).some(Boolean);
}
