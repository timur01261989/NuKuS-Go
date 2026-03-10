export const uploadSections = [
  {
    title: "Asosiy hujjatlar",
    description:
      "Pasport, haydovchilik guvohnomasi va texpasport rasmlarini yuklang.",
    fields: [
      {
        key: "passport",
        label: "Pasport",
        docType: "passport",
        required: true,
        accept: "image/*",
        maxWidth: 1600,
        quality: 0.8,
        storageFolder: "passport",
      },
      {
        key: "license",
        label: "Prava",
        docType: "license",
        required: true,
        accept: "image/*",
        maxWidth: 1400,
        quality: 0.75,
        storageFolder: "license",
      },
      {
        key: "texpassport",
        label: "Texpasport",
        docType: "texpassport",
        required: true,
        accept: "image/*",
        maxWidth: 1400,
        quality: 0.75,
        storageFolder: "texpassport",
      },
    ],
  },
  {
    title: "Qo'shimcha rasmlar",
    description:
      "Shaxsiy rasm va mashina rasmini yuklang. Mashina rasmi faqat 1 ta bo'ladi.",
    fields: [
      {
        key: "personalPhoto",
        label: "Shaxsiy rasm",
        docType: "personal_photo",
        required: true,
        accept: "image/*",
        maxWidth: 1200,
        quality: 0.72,
        storageFolder: "personal-photo",
      },
      {
        key: "carPhoto",
        label: "Mashina rasmi",
        docType: "car_photo",
        required: true,
        accept: "image/*",
        maxWidth: 1400,
        quality: 0.7,
        storageFolder: "car-photo",
      },
    ],
  },
];

export const DRIVER_DOCUMENT_FIELDS = uploadSections.flatMap(
  (section) => section.fields
);

export const DRIVER_DOCUMENT_FIELD_MAP = DRIVER_DOCUMENT_FIELDS.reduce(
  (acc, field) => {
    acc[field.key] = field;
    return acc;
  },
  {}
);

export const DOC_TYPE_TO_FIELD_KEY_MAP = DRIVER_DOCUMENT_FIELDS.reduce(
  (acc, field) => {
    acc[field.docType] = field.key;
    return acc;
  },
  {}
);

export const storageFolderMap = DRIVER_DOCUMENT_FIELDS.reduce((acc, field) => {
  acc[field.key] = field.storageFolder;
  return acc;
}, {});

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
