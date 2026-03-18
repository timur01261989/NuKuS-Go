import { INTERDISTRICT_TRIP_STATUS, normalizeInterDistrictStatus } from "./interDistrictStatuses";

const clientTimelineCatalog = [
  { key: INTERDISTRICT_TRIP_STATUS.SEARCHING, label: "Qidiruv" },
  { key: INTERDISTRICT_TRIP_STATUS.MATCHED, label: "Mos haydovchi" },
  { key: INTERDISTRICT_TRIP_STATUS.ACCEPTED, label: "Tasdiqlandi" },
  { key: INTERDISTRICT_TRIP_STATUS.ARRIVED_PICKUP, label: "Yetib keldi" },
  { key: INTERDISTRICT_TRIP_STATUS.PICKED_UP, label: "Yo‘lga chiqildi" },
  { key: INTERDISTRICT_TRIP_STATUS.IN_TRANSIT, label: "Safarda" },
  { key: INTERDISTRICT_TRIP_STATUS.COMPLETED, label: "Yakunlandi" },
];

export function buildClientTripTimeline(status, activeTripRequest) {
  const canonical = normalizeInterDistrictStatus(status);
  const currentIndex = Math.max(0, clientTimelineCatalog.findIndex((item) => item.key === canonical));
  return clientTimelineCatalog.map((item, index) => ({
    ...item,
    done: index < currentIndex,
    active: index === currentIndex,
    pending: index > currentIndex,
    at: index === currentIndex ? activeTripRequest?.updated_at || activeTripRequest?.created_at || null : null,
  }));
}

export function buildClientTripSignals({ activeTripRequest, routeInfo, canonicalStatus }) {
  const seatCount = Array.isArray(activeTripRequest?.selected_seats)
    ? activeTripRequest.selected_seats.length
    : 0;
  const normalized = normalizeInterDistrictStatus(canonicalStatus || activeTripRequest?.status);
  return {
    seatCount,
    distanceLabel: routeInfo?.distanceKm != null ? `${Number(routeInfo.distanceKm).toFixed(1)} km` : "Masofa aniqlanmoqda",
    durationLabel: routeInfo?.durationMin != null ? `${Math.round(Number(routeInfo.durationMin))} daqiqa` : "Vaqt aniqlanmoqda",
    cancelable:
      normalized !== INTERDISTRICT_TRIP_STATUS.COMPLETED &&
      normalized !== INTERDISTRICT_TRIP_STATUS.CANCELED,
    statusTone:
      normalized === INTERDISTRICT_TRIP_STATUS.MATCHED || normalized === INTERDISTRICT_TRIP_STATUS.ACCEPTED
        ? "processing"
        : normalized === INTERDISTRICT_TRIP_STATUS.COMPLETED
          ? "success"
          : normalized === INTERDISTRICT_TRIP_STATUS.CANCELED
            ? "error"
            : "default",
  };
}

export function buildQueueHealthMeta({ requests = [], serviceActive = false, mode = "standard", lastSocketEventAt = null }) {
  const count = requests.length;
  const hotCount = requests.filter((item) => normalizeInterDistrictStatus(item.status) === INTERDISTRICT_TRIP_STATUS.MATCHED || item.status === "new").length;
  const stalenessMs = lastSocketEventAt ? Math.max(0, Date.now() - new Date(lastSocketEventAt).getTime()) : null;
  return {
    count,
    hotCount,
    serviceActive,
    mode,
    freshnessLabel:
      stalenessMs == null
        ? "Realtime kutilyapti"
        : stalenessMs < 60_000
          ? "Yangi signal"
          : stalenessMs < 5 * 60_000
            ? "Signal normal"
            : "Signal sust",
    tone: !serviceActive ? "warning" : hotCount > 0 ? "processing" : "success",
  };
}

export function buildDriverTripPreview({ pricing, seats, activeTrip }) {
  const taken = Object.values(seats || {}).filter((item) => item?.taken).length;
  const distanceKm = Number(pricing?.distanceKm || activeTrip?.distance_km || 0);
  const etaMin = Number(pricing?.etaMin || activeTrip?.eta_min || 0);
  return {
    taken,
    occupancyLabel: taken ? `${taken} ta joy band` : "Joylar bo‘sh",
    earningsLabel: Math.round(Number(pricing?.total || activeTrip?.base_price || 0)),
    distanceKm,
    etaMin,
    routeConfidence: distanceKm > 0 && etaMin > 0 ? "Yuqori" : distanceKm > 0 || etaMin > 0 ? "O‘rtacha" : "Taxminiy",
  };
}

export function buildConflictGuard({ activeTrip, respondingRequestId = null }) {
  return {
    canRespond: !respondingRequestId,
    reason: respondingRequestId
      ? "So‘rovga javob yuborilmoqda"
      : activeTrip
        ? "Aktiv reys bilan ehtiyotkor ishlang"
        : null,
  };
}

export function buildReservationReadiness(activeTrip) {
  return {
    ready: Boolean(activeTrip),
    label: activeTrip ? "Bron va safar qabul qilish tayyor" : "Avval reys yarating",
  };
}
