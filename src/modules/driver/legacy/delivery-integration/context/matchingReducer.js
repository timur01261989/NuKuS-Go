/**
 * matchingReducer.js
 * Haydovchi yo'nalishi, rejim va yuk parametrlari bo'yicha parcel'larni saralash uchun reducer.
 * Bu reducer UI'dan keladigan action'larni bir joyda boshqaradi.
 */
export const DEFAULT_INTEGRATION_STATE = {
  enabled: false,
  capacity: "M",
  onlyMyRoute: true,
  radiusKm: 5,
  route: null, // { points: [[lat,lng],...], name?: string }
  driverMode: "CITY", // CITY | INTERDISTRICT | INTERPROVINCIAL
  onTrip: false,
  parcels: [],
  filtered: [],
  lastEvent: null,
  loading: false,
  error: null,
};

export function matchingReducer(state, action) {
  switch (action.type) {
    case "SET_ENABLED":
      return { ...state, enabled: !!action.enabled };
    case "SET_CAPACITY":
      return { ...state, capacity: action.capacity || "M" };
    case "SET_ONLY_MY_ROUTE":
      return { ...state, onlyMyRoute: !!action.onlyMyRoute };
    case "SET_RADIUS":
      return { ...state, radiusKm: Math.max(1, Number(action.radiusKm || 5)) };
    case "SET_ROUTE":
      return { ...state, route: action.route || null };
    case "SET_DRIVER_MODE":
      return { ...state, driverMode: action.driverMode || "CITY" };
    case "SET_ON_TRIP":
      return { ...state, onTrip: !!action.onTrip };
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.error || "Xatolik" };
    case "SET_PARCELS":
      return { ...state, loading: false, error: null, parcels: Array.isArray(action.parcels) ? action.parcels : [] };
    case "SET_FILTERED":
      return { ...state, filtered: Array.isArray(action.filtered) ? action.filtered : [] };
    case "REALTIME_EVENT":
      return { ...state, lastEvent: action.event || null };
    default:
      return state;
  }
}
