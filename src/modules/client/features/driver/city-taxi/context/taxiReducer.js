/**
 * 🧠 taxiReducer.js
 * Toza logika (driver_web_module uslubi): statuslar + order holatlari
 */

export const TaxiOrderStatus = {
  NEW: "NEW",
  ACCEPTED: "ACCEPTED",
  ARRIVED: "ARRIVED",
  ON_TRIP: "ON_TRIP",
  COMPLETED: "COMPLETED",
  DECLINED: "DECLINED",
  CANCELED: "CANCELED",
};

export const initialTaxiState = {
  isOnline: false,

  driverLocation: {
    latlng: null, // [lat,lng]
    heading: 0,   // degrees (0..360)
    accuracy: null,
    updatedAt: null,
  },

  incomingOrder: null, // NEW order to show in modal
  activeOrder: null,   // ACCEPTED/ARRIVED/ON_TRIP...

  ordersFeed: {
    items: [],
    status: "idle", // idle|loading|success|error
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
