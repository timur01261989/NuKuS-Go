export const MODES = {
  STANDARD: 'STANDARD',
  PREMIUM: 'PREMIUM',
};

export const initialState = {
  mode: MODES.STANDARD,
  driverLoc: null, // [lat,lng]
  // 4 seats: FL, FR, RL, RR
  seats: {
    FL: { taken: false, price: 0, label: 'Old chap' },
    FR: { taken: false, price: 0, label: 'Old o‘ng' },
    RL: { taken: false, price: 0, label: 'Orqa chap' },
    RR: { taken: false, price: 0, label: 'Orqa o‘ng' },
  },
  passengers: [], // {id,name,phone,seatKey, pickupAddress?}
  // fixed route for STANDARD (can be changed in districtData)
  route: {
    from: 'Nukus Avtovokzal',
    to: "Qo‘ng‘irot Markaz",
    stops: ['Nukus', "Xo‘jayli", 'Taxiatosh', "Qo‘ng‘irot"],
  },
  pricing: {
    baseSeatPrice: 30000,
    pickupFee: 5000,
    total: 0,
    etaMin: null,
    distanceKm: null,
  },
  // PREMIUM: incoming requests / clients on map
  premiumClients: [], // {id, name, phone, lat, lng, address, requestedSeats, created_at}

  // Partial departure (Premium)
  partialDeparture: {
    enabled: false,
    strategy: 'driver_cover', // 'driver_cover' | 'split_to_clients'
  },

  lastError: null,
};

export function pricingReducer(state, action) {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        mode: action.mode,
        // keep seats/passengers in memory to avoid losing data when switching
      };

    case 'SET_DRIVER_LOC':
      return { ...state, driverLoc: action.loc };

    case 'TOGGLE_SEAT': {
      const key = action.key;
      const seat = state.seats[key];
      if (!seat) return state;
      const next = { ...state.seats, [key]: { ...seat, taken: !seat.taken } };
      return { ...state, seats: next };
    }

    case 'SET_SEAT_PRICE': {
      const { key, price } = action;
      const seat = state.seats[key];
      if (!seat) return state;
      const next = { ...state.seats, [key]: { ...seat, price: Math.max(0, Number(price) || 0) } };
      return { ...state, seats: next };
    }

    case 'SET_PASSENGERS':
      return { ...state, passengers: action.passengers || [] };

    case 'ADD_PASSENGER':
      return { ...state, passengers: [ ...state.passengers, action.passenger ] };

    case 'REMOVE_PASSENGER':
      return { ...state, passengers: state.passengers.filter(p => p.id !== action.id) };

    case 'SET_ROUTE':
      return { ...state, route: { ...state.route, ...(action.route || {}) } };

    case 'SET_PRICING':
      return { ...state, pricing: { ...state.pricing, ...(action.pricing || {}) } };

    case 'SET_PREMIUM_CLIENTS':
      return { ...state, premiumClients: action.clients || [] };

    case 'UPSERT_PREMIUM_CLIENT': {
      const c = action.client;
      if (!c?.id) return state;
      const idx = state.premiumClients.findIndex(x => x.id === c.id);
      const next = idx >= 0
        ? state.premiumClients.map(x => (x.id === c.id ? { ...x, ...c } : x))
        : [c, ...state.premiumClients];
      return { ...state, premiumClients: next };
    }

    case 'SET_PARTIAL_DEPARTURE':
      return { ...state, partialDeparture: { ...state.partialDeparture, ...(action.payload || {}) } };

    case 'SET_ERROR':
      return { ...state, lastError: action.error || null };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}
