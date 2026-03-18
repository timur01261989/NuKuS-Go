export const TAXI_STATUS = Object.freeze({
  NEW: "new",
  SEARCHING: "searching",
  ACCEPTED: "accepted",
  ARRIVED: "arrived",
  ON_TRIP: "on_trip",
  COMPLETED: "completed",
  CANCELED: "canceled",
  DECLINED: "declined",
});

const STATUS_ALIASES = new Map([
  ["new", TAXI_STATUS.NEW],
  ["pending", TAXI_STATUS.NEW],
  ["searching", TAXI_STATUS.SEARCHING],
  ["created", TAXI_STATUS.SEARCHING],
  ["accepted", TAXI_STATUS.ACCEPTED],
  ["coming", TAXI_STATUS.ACCEPTED],
  ["driver_assigned", TAXI_STATUS.ACCEPTED],
  ["arrived", TAXI_STATUS.ARRIVED],
  ["on_trip", TAXI_STATUS.ON_TRIP],
  ["ontrip", TAXI_STATUS.ON_TRIP],
  ["in_trip", TAXI_STATUS.ON_TRIP],
  ["completed", TAXI_STATUS.COMPLETED],
  ["done", TAXI_STATUS.COMPLETED],
  ["finished", TAXI_STATUS.COMPLETED],
  ["cancelled", TAXI_STATUS.CANCELED],
  ["canceled", TAXI_STATUS.CANCELED],
  ["declined", TAXI_STATUS.DECLINED],
  ["rejected", TAXI_STATUS.DECLINED],
  ["expired", TAXI_STATUS.CANCELED],
]);

export function normalizeTaxiStatus(value, fallback = TAXI_STATUS.SEARCHING) {
  if (value == null) return fallback;
  const raw = String(value).trim();
  if (!raw) return fallback;
  const key = raw.toLowerCase();
  return STATUS_ALIASES.get(key) || fallback;
}

export function isTaxiCompleted(status) {
  return normalizeTaxiStatus(status) === TAXI_STATUS.COMPLETED;
}

export function isTaxiActive(status) {
  return [
    TAXI_STATUS.ACCEPTED,
    TAXI_STATUS.ARRIVED,
    TAXI_STATUS.ON_TRIP,
  ].includes(normalizeTaxiStatus(status));
}

export function getTaxiUiStepFromStatus(status) {
  const normalized = normalizeTaxiStatus(status);
  if (normalized === TAXI_STATUS.SEARCHING) return "searching";
  if ([TAXI_STATUS.ACCEPTED, TAXI_STATUS.ARRIVED, TAXI_STATUS.ON_TRIP].includes(normalized)) return "coming";
  return "main";
}

export function getTaxiPollingInterval(status, step) {
  const normalized = normalizeTaxiStatus(status);
  if (step === "searching" || normalized === TAXI_STATUS.SEARCHING) return 2000;
  if ([TAXI_STATUS.ACCEPTED, TAXI_STATUS.ARRIVED].includes(normalized)) return 3500;
  if (normalized === TAXI_STATUS.ON_TRIP) return 8000;
  return 4000;
}
