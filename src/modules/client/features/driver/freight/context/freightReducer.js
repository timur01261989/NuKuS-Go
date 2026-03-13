export const initialFreightState = {
  // flow
  step: 1, // 1 vehicle, 2 mode setup, 3 active
  status: "EMPTY", // EMPTY | PARTIAL_LOAD | FULL

  // selected vehicle (type affects UI)
  vehicle: null, // { id, title, kind, capacityTons, bodyMeters, image }
  mode: null, // 'long-haul' | 'city-logistics' | 'bulk-materials'

  // common settings
  capacity: "M", // M | L | XL (rough)
  photos: [], // [{uid, url, name}] - vehicle photos

  // long-haul
  route: { from: null, to: null, returnTrip: false },
  loadFillPct: 0, // 0..100

  // city logistics
  pricing: { type: "hourly", hourly: 50000, trip: 100000 },
  movers: { enabled: false, count: 0, pricePerMover: 50000 },

  // bulk materials
  material: { type: null, variant: null }, // e.g. {type:'sand', variant:'yellow'}
  volume: { unit: "trip", amount: 1 }, // trip or ton
  bulkPrice: { perTrip: 800000, perTon: 50000 },
  quarry: null, // { lat,lng,address }

  // feed/orders
  orders: [],
  loadingOrders: false,
  lastError: null,

  // driver info (optional)
  driver: { online: false, lat: null, lng: null },
};

export function freightReducer(state, action) {
  switch (action.type) {
    case "GO_STEP":
      return { ...state, step: action.step };
    case "SET_STATUS":
      return { ...state, status: action.status };
    case "SET_VEHICLE":
      return { ...state, vehicle: action.vehicle };
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "SET_CAPACITY":
      return { ...state, capacity: action.capacity };
    case "SET_PHOTOS":
      return { ...state, photos: action.photos || [] };

    case "SET_ROUTE":
      return { ...state, route: { ...state.route, ...action.route } };
    case "SET_RETURN_TRIP":
      return { ...state, route: { ...state.route, returnTrip: !!action.value } };
    case "SET_LOAD_FILL":
      return { ...state, loadFillPct: Math.max(0, Math.min(100, Number(action.pct ?? 0))) };

    case "SET_CITY_PRICING":
      return { ...state, pricing: { ...state.pricing, ...action.pricing } };
    case "SET_MOVERS":
      return { ...state, movers: { ...state.movers, ...action.movers } };

    case "SET_MATERIAL":
      return { ...state, material: { ...state.material, ...action.material } };
    case "SET_VOLUME":
      return { ...state, volume: { ...state.volume, ...action.volume } };
    case "SET_BULK_PRICE":
      return { ...state, bulkPrice: { ...state.bulkPrice, ...action.bulkPrice } };
    case "SET_QUARRY":
      return { ...state, quarry: action.quarry };

    case "ORDERS_LOADING":
      return { ...state, loadingOrders: true, lastError: null };
    case "ORDERS_SUCCESS":
      return { ...state, loadingOrders: false, orders: action.orders || [], lastError: null };
    case "ORDERS_ERROR":
      return { ...state, loadingOrders: false, lastError: action.error || "Xatolik" };

    case "SET_DRIVER_ONLINE":
      return { ...state, driver: { ...state.driver, online: !!action.online } };
    case "SET_DRIVER_LOC":
      return { ...state, driver: { ...state.driver, lat: action.lat, lng: action.lng } };

    default:
      return state;
  }
}
