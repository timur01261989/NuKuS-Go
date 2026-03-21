
export const FREIGHT_CANONICAL_STATUSES = Object.freeze({
  DRAFT: "draft",
  SEARCHING: "searching",
  ACCEPTED: "accepted",
  IN_TRANSIT: "in_transit",
  COMPLETED: "completed",
  CANCELED: "canceled",
});

const STATUS_ALIASES = new Map([
  ["draft", FREIGHT_CANONICAL_STATUSES.DRAFT],
  ["new", FREIGHT_CANONICAL_STATUSES.DRAFT],
  ["posted", FREIGHT_CANONICAL_STATUSES.SEARCHING],
  ["searching", FREIGHT_CANONICAL_STATUSES.SEARCHING],
  ["matched", FREIGHT_CANONICAL_STATUSES.SEARCHING],
  ["accepted", FREIGHT_CANONICAL_STATUSES.ACCEPTED],
  ["assigned", FREIGHT_CANONICAL_STATUSES.ACCEPTED],
  ["pickup", FREIGHT_CANONICAL_STATUSES.IN_TRANSIT],
  ["picked_up", FREIGHT_CANONICAL_STATUSES.IN_TRANSIT],
  ["on_route", FREIGHT_CANONICAL_STATUSES.IN_TRANSIT],
  ["in_transit", FREIGHT_CANONICAL_STATUSES.IN_TRANSIT],
  ["completed", FREIGHT_CANONICAL_STATUSES.COMPLETED],
  ["done", FREIGHT_CANONICAL_STATUSES.COMPLETED],
  ["delivered", FREIGHT_CANONICAL_STATUSES.COMPLETED],
  ["cancelled", FREIGHT_CANONICAL_STATUSES.CANCELED],
  ["canceled", FREIGHT_CANONICAL_STATUSES.CANCELED],
]);

export function normalizeFreightStatus(value) {
  const key = String(value || "").trim().toLowerCase();
  return STATUS_ALIASES.get(key) || FREIGHT_CANONICAL_STATUSES.SEARCHING;
}

export function isFreightTerminalStatus(status) {
  const current = normalizeFreightStatus(status);
  return current === FREIGHT_CANONICAL_STATUSES.COMPLETED || current === FREIGHT_CANONICAL_STATUSES.CANCELED;
}
