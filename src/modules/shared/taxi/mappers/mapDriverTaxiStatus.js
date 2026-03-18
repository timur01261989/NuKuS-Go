import { TAXI_STATUS, normalizeTaxiStatus } from "../constants/taxiStatuses.js";

export function mapDriverTaxiStatus(value, fallback = TAXI_STATUS.NEW) {
  return normalizeTaxiStatus(value, fallback);
}

export default mapDriverTaxiStatus;
