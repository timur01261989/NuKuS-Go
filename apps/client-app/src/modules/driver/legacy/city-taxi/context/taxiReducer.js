/**
 * 🧠 taxiReducer.js
 * Driver taxi holatlari canonical status enum bilan boshqariladi.
 */
import { TAXI_STATUS } from "@/modules/shared/taxi/constants/taxiStatuses.js";

export const TaxiOrderStatus = {
  NEW: TAXI_STATUS.NEW,
  SEARCHING: TAXI_STATUS.SEARCHING,
  ACCEPTED: TAXI_STATUS.ACCEPTED,
  ARRIVED: TAXI_STATUS.ARRIVED,
  ON_TRIP: TAXI_STATUS.ON_TRIP,
  COMPLETED: TAXI_STATUS.COMPLETED,
  DECLINED: TAXI_STATUS.DECLINED,
  CANCELED: TAXI_STATUS.CANCELED,
};

export const initialTaxiState = {
  isOnline: false,

  driverLocation: {
    latlng: null,
    heading: 0,
    accuracy: null,
    updatedAt: null,
  },

  incomingOrder: null,
  activeOrder: null,

  ordersFeed: {
    items: [],
    status: "idle",
    error: null,
    lastFetchAt: null,
  },

  earnings: {
    todayUzs: 0,
    weekUzs: 0,
    tripsToday: 0,
  },

  map: {
    flyToDriver: false,
  },

  ui: {
    toast: null,
  },
};

export function taxiReducer(state, action) {
  switch (action.type) {
    case "driver/setOnline":
      return { ...state, isOnline: action.payload };

    case "driver/setLocation":
      return { ...state, driverLocation: { ...state.driverLocation, ...action.payload } };

    case "orders/fetchStart":
      return { ...state, ordersFeed: { ...state.ordersFeed, status: "loading", error: null } };

    case "orders/fetchSuccess":
      return { ...state, ordersFeed: { items: action.payload || [], status: "success", error: null, lastFetchAt: Date.now() } };

    case "orders/fetchError":
      return { ...state, ordersFeed: { ...state.ordersFeed, status: "error", error: action.payload || "Unknown error" } };

    case "orders/setIncoming":
      return { ...state, incomingOrder: action.payload };

    case "orders/setActive":
      return { ...state, activeOrder: action.payload };

    case "orders/updateActive":
      return state.activeOrder
        ? { ...state, activeOrder: { ...state.activeOrder, ...action.payload } }
        : state;

    case "earnings/set":
      return { ...state, earnings: action.payload };

    case "map/flyToDriver":
      return { ...state, map: { ...state.map, flyToDriver: true } };

    case "map/consumeFlyToDriver":
      return { ...state, map: { ...state.map, flyToDriver: false } };

    case "ui/toast":
      return { ...state, ui: { ...state.ui, toast: action.payload } };

    case "ui/clearToast":
      return { ...state, ui: { ...state.ui, toast: null } };

    case "driver/reset":
      return initialTaxiState;

    default:
      return state;
  }
}
