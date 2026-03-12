export const VEHICLE_TYPE_PRESETS = {
  light_car: {
    label: "Engil mashina",
    legacyTransportType: "light_car",
    seats: 4,
    cargoKg: 80,
    cargoM3: 0.8,
    serviceTypes: {
      city: { passenger: true, delivery: true, freight: false },
      intercity: { passenger: true, delivery: true, freight: false },
      interdistrict: { passenger: true, delivery: true, freight: false },
    },
  },
  minibus: {
    label: "Minibus",
    legacyTransportType: "bus_gazel",
    seats: 8,
    cargoKg: 300,
    cargoM3: 2,
    serviceTypes: {
      city: { passenger: true, delivery: true, freight: false },
      intercity: { passenger: true, delivery: true, freight: false },
      interdistrict: { passenger: true, delivery: true, freight: false },
    },
  },
  bus: {
    label: "Avtobus",
    legacyTransportType: "bus_gazel",
    seats: 20,
    cargoKg: 500,
    cargoM3: 3,
    serviceTypes: {
      city: { passenger: true, delivery: true, freight: false },
      intercity: { passenger: true, delivery: true, freight: false },
      interdistrict: { passenger: true, delivery: true, freight: false },
    },
  },
  small_truck: {
    label: "Kichik yuk mashinasi",
    legacyTransportType: "truck",
    seats: 2,
    cargoKg: 1500,
    cargoM3: 10,
    serviceTypes: {
      city: { passenger: false, delivery: true, freight: true },
      intercity: { passenger: false, delivery: true, freight: true },
      interdistrict: { passenger: false, delivery: true, freight: true },
    },
  },
  big_truck: {
    label: "Katta yuk mashinasi",
    legacyTransportType: "truck",
    seats: 2,
    cargoKg: 5000,
    cargoM3: 25,
    serviceTypes: {
      city: { passenger: false, delivery: false, freight: true },
      intercity: { passenger: false, delivery: false, freight: true },
      interdistrict: { passenger: false, delivery: false, freight: true },
    },
  },
};

export const TRANSPORT_OPTIONS = Object.entries(VEHICLE_TYPE_PRESETS).map(
  ([value, preset]) => ({ value, label: preset.label })
);

export const SERVICE_AREA_OPTIONS = [
  { key: "city", label: "Shahar ichida" },
  { key: "intercity", label: "Viloyatlararo" },
  { key: "interdistrict", label: "Tumanlararo" },
];

export const SERVICE_TYPE_OPTIONS = [
  { key: "passenger", label: "Yo‘lovchi" },
  { key: "delivery", label: "Eltish" },
  { key: "freight", label: "Yuk tashish" },
];

export function cloneServiceTypes(input) {
  return {
    city: {
      passenger: !!input?.city?.passenger,
      delivery: !!input?.city?.delivery,
      freight: !!input?.city?.freight,
    },
    intercity: {
      passenger: !!input?.intercity?.passenger,
      delivery: !!input?.intercity?.delivery,
      freight: !!input?.intercity?.freight,
    },
    interdistrict: {
      passenger: !!input?.interdistrict?.passenger,
      delivery: !!input?.interdistrict?.delivery,
      freight: !!input?.interdistrict?.freight,
    },
  };
}

export function getDefaultServiceTypes(vehicleType = "light_car") {
  const preset = VEHICLE_TYPE_PRESETS[vehicleType] || VEHICLE_TYPE_PRESETS.light_car;
  return cloneServiceTypes(preset.serviceTypes);
}

export function getVehiclePreset(vehicleType = "light_car") {
  return VEHICLE_TYPE_PRESETS[vehicleType] || VEHICLE_TYPE_PRESETS.light_car;
}

export function toLegacyTransportType(vehicleType = "light_car") {
  return getVehiclePreset(vehicleType).legacyTransportType;
}

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
