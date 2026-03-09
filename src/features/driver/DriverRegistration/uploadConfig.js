export const uploadSections = [
  {
    title: "Asosiy hujjatlar",
    description: "Pasport, haydovchilik guvohnomasi va tex passport rasmlarini yuklang.",
    fields: [
      { key: "passportFront", label: "Pasport old tomoni", required: true },
      { key: "passportBack", label: "Pasport orqa tomoni", required: true },
      { key: "driverLicenseFront", label: "Haydovchilik guvohnomasi old tomoni", required: true },
      { key: "driverLicenseBack", label: "Haydovchilik guvohnomasi orqa tomoni", required: false },
      { key: "techPassportFront", label: "Tex passport old tomoni", required: true },
      { key: "techPassportBack", label: "Tex passport orqa tomoni", required: false },
      { key: "selfieWithPassport", label: "Pasport bilan selfie", required: false },
    ],
  },
  {
    title: "Mashina rasmlari",
    description: "Mashinaning 4 tomondan tushirilgan rasmlarini yuklang.",
    fields: [
      { key: "carPhoto1", label: "Car photo 1", required: true },
      { key: "carPhoto2", label: "Car photo 2", required: true },
      { key: "carPhoto3", label: "Car photo 3", required: true },
      { key: "carPhoto4", label: "Car photo 4", required: true },
    ],
  },
];

export const vehicleTypeOptions = [
  { value: "passenger", label: "Engil mashina" },
  { value: "suv", label: "SUV" },
  { value: "minivan", label: "Minivan" },
  { value: "van", label: "Van" },
  { value: "pickup", label: "Pickup" },
  { value: "truck_small", label: "Kichik yuk mashinasi" },
  { value: "truck_medium", label: "O'rta yuk mashinasi" },
  { value: "truck_large", label: "Katta yuk mashinasi" },
  { value: "bus", label: "Avtobus" },
  { value: "gazel", label: "Gazel" },
];

export const VEHICLE_DEFAULTS = {
  passenger: { seats: "4", cargoKg: "100", cargoM3: "0.5" },
  suv: { seats: "5", cargoKg: "200", cargoM3: "0.8" },
  minivan: { seats: "7", cargoKg: "400", cargoM3: "1.5" },
  van: { seats: "2", cargoKg: "1000", cargoM3: "6" },
  truck_small: { seats: "2", cargoKg: "1500", cargoM3: "10" },
  truck_medium: { seats: "3", cargoKg: "5000", cargoM3: "25" },
  truck_large: { seats: "2", cargoKg: "20000", cargoM3: "80" },
  bus: { seats: "45", cargoKg: "500", cargoM3: "5" },
  gazel: { seats: "2", cargoKg: "1500", cargoM3: "12" },
};

export const storageFolderMap = {
  passportFront: "passports",
  passportBack: "passports",
  driverLicenseFront: "licenses",
  driverLicenseBack: "licenses",
  techPassportFront: "tech_passports",
  techPassportBack: "tech_passports",
  selfieWithPassport: "selfies",
  carPhoto1: "cars",
  carPhoto2: "cars",
};