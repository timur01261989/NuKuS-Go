/**
 * validators.js — Driver registration forma validatsiyasi
 *
 * DOCX tavsiyasi: driver-registration/validators qatlamini ajrating.
 * Pure funksiyalar — test qilish oson, React ga bog'liq emas.
 */

export const PASSPORT_RE   = /^[A-Z]{2}\d{7}$/;
export const PHONE_RE      = /^\d{9,12}$/;   // raqamlar tozalangandan keyin
export const PLATE_RE      = /^[A-Z0-9]{6,10}$/;

/**
 * Shaxsiy ma'lumotlar bosqichini validatsiya qiladi (Step 1).
 */
export function validatePersonalStep(form) {
  const errors = {};
  if (!form.lastName?.trim())   errors.lastName   = 'Familiya kiritilishi shart';
  if (!form.firstName?.trim())  errors.firstName  = 'Ism kiritilishi shart';
  const cleanPhone = String(form.phone || '').replace(/\D/g, '');
  if (!PHONE_RE.test(cleanPhone)) errors.phone = 'Telefon raqami noto\'g\'ri';
  const passport = String(form.passportNumber || '').toUpperCase().replace(/\s/g, '');
  if (passport && !PASSPORT_RE.test(passport)) errors.passportNumber = 'Pasport formati: AA1234567';
  return errors;
}

/**
 * Transport ma'lumotlari bosqichini validatsiya qiladi (Step 2).
 */
export function validateVehicleStep(form) {
  const errors = {};
  if (!form.vehicleType) errors.vehicleType = 'Transport turini tanlang';
  if (!form.brand?.trim())  errors.brand  = 'Marka kiritilishi shart';
  if (!form.model?.trim())  errors.model  = 'Model kiritilishi shart';
  const plate = String(form.plateNumber || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (plate && !PLATE_RE.test(plate)) errors.plateNumber = 'Davlat raqam noto\'g\'ri';
  if (form.year) {
    const y = parseInt(form.year, 10);
    const now = new Date().getFullYear();
    if (isNaN(y) || y < 1990 || y > now + 1) errors.year = `Yil 1990–${now + 1} oralig'ida bo'lishi kerak`;
  }
  return errors;
}

/**
 * Hujjatlar bosqichini validatsiya qiladi (Step 3).
 * @param {object} docMap — { doc_type: File|url } formatida
 * @param {string[]} required — majburiy doc_type'lar ro'yxati
 */
export function validateDocumentStep(docMap, required = []) {
  const errors = {};
  for (const docType of required) {
    if (!docMap?.[docType]) errors[docType] = `${docType} hujjati yuklanishi shart`;
  }
  return errors;
}

/** Barcha bosqichlarning umumiy validatsiyasi */
export function validateAllSteps(form, docMap, requiredDocs = []) {
  return {
    ...validatePersonalStep(form),
    ...validateVehicleStep(form),
    ...validateDocumentStep(docMap, requiredDocs),
  };
}

/** Xatolar ob'ekti bo'sh ekanligini tekshiradi */
export function isValid(errors) {
  return Object.keys(errors || {}).length === 0;
}
