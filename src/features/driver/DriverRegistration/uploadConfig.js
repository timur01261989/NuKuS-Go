export const TRANSPORT_OPTIONS = [
  { value: "light_car", label: "Engil mashina" },
  { value: "bus_gazel", label: "Avtobus / Gazel" },
  { value: "truck", label: "Yuk tashish mashinasi" },
];

export const DRIVER_DOCUMENT_FIELDS = [
  { key: "passportFront", label: "Pasport old tomoni", docType: "passport_front", required: true, accept: "image/*", maxWidth: 1600, quality: 0.8 },
  { key: "passportBack", label: "Pasport orqa tomoni", docType: "passport_back", required: true, accept: "image/*", maxWidth: 1600, quality: 0.8 },
  { key: "driverLicenseFront", label: "Prava old tomoni", docType: "driver_license_front", required: true, accept: "image/*", maxWidth: 1400, quality: 0.75 },
  { key: "techPassportFront", label: "Tex passport old tomoni", docType: "tech_passport_front", required: true, accept: "image/*", maxWidth: 1400, quality: 0.75 },
  { key: "personalPhoto", label: "Shaxsiy rasm", docType: "personal_photo", required: true, accept: "image/*", maxWidth: 1200, quality: 0.72 },
  { key: "carPhoto", label: "Mashina rasmi", docType: "car_photo", required: true, accept: "image/*", maxWidth: 1400, quality: 0.72 },
];

export const DRIVER_DOCUMENT_FIELD_MAP = DRIVER_DOCUMENT_FIELDS.reduce((acc, item) => {
  acc[item.key] = item;
  return acc;
}, {});
