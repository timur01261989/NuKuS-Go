import { REQUIRED_DOCUMENT_KEYS } from "./uploadConfig";

export const STEP_FIELD_MAP = [
  ["last_name", "first_name", "phone", "passport_number"],
  ["transport_type", "vehicle_brand", "vehicle_model", "vehicle_plate"],
  ["driver_license_number"],
];

export function validateDocumentsStep(files) {
  const hasMissingRequired = REQUIRED_DOCUMENT_KEYS.some((key) => !files[key]);
  return hasMissingRequired ? "Majburiy hujjat rasmlarini yuklang" : null;
}
