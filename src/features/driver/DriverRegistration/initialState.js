export const initialFormState = {
  lastName: "",
  firstName: "",
  middleName: "",
  phone: "",
  passportNumber: "",

  vehicleType: "passenger",
  brand: "",
  model: "",
  plateNumber: "",
  year: "",
  color: "",
  seats: "4",
  cargoKg: "100",
  cargoM3: "",

  notes: "",
};

export const initialFilesState = {
  passportFront: null,
  passportBack: null,
  driverLicenseFront: null,
  driverLicenseBack: null,
  techPassportFront: null,
  techPassportBack: null,
  selfieWithPassport: null,
  carPhoto1: null,
  carPhoto2: null,
  carPhoto3: null,
  carPhoto4: null,
};

export const initialErrorsState = {
  personal: {},
  vehicle: {},
  documents: {},
};
