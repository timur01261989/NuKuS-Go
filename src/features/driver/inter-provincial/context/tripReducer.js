export const TRIP_STATUS = {
  DRAFT: "DRAFT",
  COLLECTING: "COLLECTING",
  ON_WAY: "ON_WAY",
  FINISHED: "FINISHED",
};

export const FEMALE_MODE = {
  OFF: "OFF",
  ALL_FEMALE: "ALL_FEMALE",
  BACK_ONLY: "BACK_ONLY",
};

export const AMENITIES = [
  { key: "AC", label: "❄️ AC" },
  { key: "USB", label: "🔌 USB" },
  { key: "LUGGAGE", label: "🧳 Yukxona" },
  { key: "NO_SMOKE", label: "🚭 Chekish yo'q" },
  { key: "MUSIC", label: "🎵 Musiqa/Wi‑Fi" },
];

export const initialTripState = {
  tripId: null,
  status: TRIP_STATUS.DRAFT,
  route: { from: "Nukus", to: "Toshkent", transit: [] },
  dateTime: null,
  dateTimeLabel: "Bugun, 14:00",
  seats: [
    { id: "F1", label: "Oldi o'rindiq", price: 200000, taken: false, type: "seat" },
    { id: "B1", label: "Orqa chap", price: 180000, taken: false, type: "seat" },
    { id: "B2", label: "Orqa o'rta", price: 150000, taken: false, type: "seat" },
    { id: "B3", label: "Orqa o'ng", price: 180000, taken: false, type: "seat" },
  ],
  passengerManifest: [],
  parcels: [],
  seatRequests: [],
  femaleMode: FEMALE_MODE.OFF,
  amenities: [],
  carPlate: "80A777AA",
  deepLink: "",
  lastError: null,
};

export function tripReducer(state, action) {
  switch (action.type) {
    case "SET_ROUTE":
      return { ...state, route: action.route };
    case "SET_DATETIME":
      return { ...state, dateTime: action.dateTime, dateTimeLabel: action.label || state.dateTimeLabel };
    case "SET_STATUS":
      return { ...state, status: action.status };
    case "SET_SEATS":
      return { ...state, seats: action.seats };
    case "TOGGLE_SEAT_TAKEN":
      return {
        ...state,
        seats: state.seats.map((s) => (s.id === action.seatId ? { ...s, taken: !s.taken } : s)),
      };
    case "SET_SEAT_PRICE":
      return {
        ...state,
        seats: state.seats.map((s) => (s.id === action.seatId ? { ...s, price: action.price } : s)),
      };
    case "SET_TRIP_ID":
      return { ...state, tripId: action.tripId };
    case "SET_SEAT_REQUESTS":
      return { ...state, seatRequests: action.requests || [] };
    case "ADD_SEAT_REQUEST":
      return { ...state, seatRequests: [...state.seatRequests, action.request] };
    case "REMOVE_SEAT_REQUEST":
      return { ...state, seatRequests: state.seatRequests.filter((r) => r.id !== action.requestId) };
    case "ADD_PASSENGER":
      return { ...state, passengerManifest: [action.passenger, ...state.passengerManifest] };
    case "SET_FEMALE_MODE":
      return { ...state, femaleMode: action.mode };
    case "SET_AMENITIES":
      return { ...state, amenities: action.amenities || [] };
    case "ADD_PARCEL":
      return { ...state, parcels: [action.parcel, ...state.parcels] };
    case "SET_ERROR":
      return { ...state, lastError: action.error || null };
    case "SET_DEEPLINK":
      return { ...state, deepLink: action.url || "" };
    default:
      return state;
  }
}
