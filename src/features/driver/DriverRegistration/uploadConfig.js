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

export const storageFolderMap = {
  passportFront: "passport-front",
  passportBack: "passport-back",
  driverLicenseFront: "driver-license-front",
  driverLicenseBack: "driver-license-back",
  techPassportFront: "tech-passport-front",
  techPassportBack: "tech-passport-back",
  selfieWithPassport: "selfie-with-passport",
  carPhoto1: "car-photo-1",
  carPhoto2: "car-photo-2",
  carPhoto3: "car-photo-3",
  carPhoto4: "car-photo-4",
};
