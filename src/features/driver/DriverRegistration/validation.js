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
  if (!String(formData.passportNumber || "").trim()) {
    errors.passportNumber = "Pasport seriya raqami kiritilmadi";
  } else if (!/^[A-Z]{2}\d{7}$/.test(String(formData.passportNumber))) {
    errors.passportNumber = "Pasport formati: AA1234567";
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
  if (formData.year && !/^\d{4}$/.test(String(formData.year))) {
    errors.year = "Yil 4 ta raqam bo'lishi kerak";
  }
  if (formData.seats && Number(formData.seats) <= 0) {
    errors.seats = "O'rindiqlar soni noto'g'ri";
  }
  if (formData.cargoKg && Number(formData.cargoKg) < 0) {
    errors.cargoKg = "Yuk limiti noto'g'ri";
  }
  if (formData.cargoM3 && Number(formData.cargoM3) < 0) {
    errors.cargoM3 = "Hajm noto'g'ri";
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
  return Object.keys(errorObject || {}).length > 0;
}
