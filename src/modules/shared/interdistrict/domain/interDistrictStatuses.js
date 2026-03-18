
export const INTERDISTRICT_TRIP_STATUS = Object.freeze({
  DRAFT: "draft",
  SEARCHING: "searching",
  MATCHED: "matched",
  ACCEPTED: "accepted",
  ARRIVED_PICKUP: "arrived_pickup",
  PICKED_UP: "picked_up",
  IN_TRANSIT: "in_transit",
  COMPLETED: "completed",
  CANCELED: "canceled",
});

const STATUS_ALIASES = Object.freeze({
  idle: INTERDISTRICT_TRIP_STATUS.DRAFT,
  new: INTERDISTRICT_TRIP_STATUS.SEARCHING,
  pending: INTERDISTRICT_TRIP_STATUS.SEARCHING,
  waiting_driver: INTERDISTRICT_TRIP_STATUS.MATCHED,
  matched: INTERDISTRICT_TRIP_STATUS.MATCHED,
  accepted: INTERDISTRICT_TRIP_STATUS.ACCEPTED,
  picking_up: INTERDISTRICT_TRIP_STATUS.ARRIVED_PICKUP,
  arrived_pickup: INTERDISTRICT_TRIP_STATUS.ARRIVED_PICKUP,
  on_trip: INTERDISTRICT_TRIP_STATUS.IN_TRANSIT,
  in_transit: INTERDISTRICT_TRIP_STATUS.IN_TRANSIT,
  completed: INTERDISTRICT_TRIP_STATUS.COMPLETED,
  cancelled: INTERDISTRICT_TRIP_STATUS.CANCELED,
  canceled: INTERDISTRICT_TRIP_STATUS.CANCELED,
  active: INTERDISTRICT_TRIP_STATUS.SEARCHING,
});

export function normalizeInterDistrictStatus(status) {
  const key = String(status || "").trim().toLowerCase();
  return STATUS_ALIASES[key] || INTERDISTRICT_TRIP_STATUS.DRAFT;
}

export function isFinishedInterDistrictStatus(status) {
  const normalized = normalizeInterDistrictStatus(status);
  return normalized === INTERDISTRICT_TRIP_STATUS.COMPLETED || normalized === INTERDISTRICT_TRIP_STATUS.CANCELED;
}

export function mapTripStatusToClientStep(status) {
  const normalized = normalizeInterDistrictStatus(status);
  switch (normalized) {
    case INTERDISTRICT_TRIP_STATUS.SEARCHING:
      return "SEARCHING";
    case INTERDISTRICT_TRIP_STATUS.MATCHED:
      return "WAITING_DRIVER";
    case INTERDISTRICT_TRIP_STATUS.ACCEPTED:
    case INTERDISTRICT_TRIP_STATUS.ARRIVED_PICKUP:
      return "PICKING_UP";
    case INTERDISTRICT_TRIP_STATUS.PICKED_UP:
    case INTERDISTRICT_TRIP_STATUS.IN_TRANSIT:
      return "ON_TRIP";
    case INTERDISTRICT_TRIP_STATUS.COMPLETED:
      return "COMPLETED";
    case INTERDISTRICT_TRIP_STATUS.CANCELED:
      return "CANCELLED";
    default:
      return "IDLE";
  }
}

export function mapTripStatusToDriverStep(status) {
  const normalized = normalizeInterDistrictStatus(status);
  switch (normalized) {
    case INTERDISTRICT_TRIP_STATUS.DRAFT:
      return "draft";
    case INTERDISTRICT_TRIP_STATUS.SEARCHING:
      return "queue";
    case INTERDISTRICT_TRIP_STATUS.MATCHED:
    case INTERDISTRICT_TRIP_STATUS.ACCEPTED:
      return "requests";
    case INTERDISTRICT_TRIP_STATUS.ARRIVED_PICKUP:
    case INTERDISTRICT_TRIP_STATUS.PICKED_UP:
    case INTERDISTRICT_TRIP_STATUS.IN_TRANSIT:
      return "active_trip";
    case INTERDISTRICT_TRIP_STATUS.COMPLETED:
      return "completed";
    case INTERDISTRICT_TRIP_STATUS.CANCELED:
      return "canceled";
    default:
      return "draft";
  }
}
