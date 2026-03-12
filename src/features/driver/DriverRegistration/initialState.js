import { getDefaultServiceTypes } from "./uploadConfig";

export const initialFormState = {
  lastName: "",
  firstName: "",
  middleName: "",
  phone: "",
  passportNumber: "",
  vehicleType: "light_car",
  brand: "",
  model: "",
  plateNumber: "",
  year: "",
  color: "",
  seats: 4,
  cargoKg: 80,
  cargoM3: 0.8,
  serviceTypes: getDefaultServiceTypes("light_car"),
};

export const initialFilesState = {
  passportFront: null,
  passportBack: null,
  driverLicenseFront: null,
  techPassportFront: null,
  personalPhoto: null,
  carPhoto: null,
};

export const initialPreviewsState = {
  passportFront: null,
  passportBack: null,
  driverLicenseFront: null,
  techPassportFront: null,
  personalPhoto: null,
  carPhoto: null,
};
