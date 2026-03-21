import { TAXI_STATUS, normalizeTaxiStatus } from "../constants/taxiStatuses.js";

export function mapServerTaxiStatus(value, fallback = TAXI_STATUS.SEARCHING) {
  return normalizeTaxiStatus(value, fallback);
}

export default mapServerTaxiStatus;
