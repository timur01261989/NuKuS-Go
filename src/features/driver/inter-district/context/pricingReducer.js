/**
 * pricingReducer.js
 * -------------------------------------------------------
 * Tumanlararo qatnov tizimining markaziy Reducer'i.
 * Barcha qulayliklar va xizmatlar (AC, Trunk, Lux, Full Salon, Eltish, Yuk, Gender) jamlangan.
 */

export const MODES = {
  STANDARD: 'STANDARD',
  PREMIUM: 'PREMIUM',
};

export const initialState = {
  mode: MODES.STANDARD,
  driverLoc: null, // [lat,lng]
  
  // 4 ta o'rindiq: FL, FR, RL, RR
  seats: {
    FL: { taken: false, price: 0, label: 'Old chap' },
    FR: { taken: false, price: 0, label: 'Old o‘ng' },
    RL: { taken: false, price: 0, label: 'Orqa chap' },
    RR: { taken: false, price: 0, label: 'Orqa o‘ng' },
  },
  
  passengers: [], // {id, name, phone, seatKey, pickupAddress?}
  
  // Yo'nalish ma'lumotlari
  route: {
    from: 'Nukus Avtovokzal',
    to: "Qo‘ng‘irot Markaz",
    stops: ['Nukus', "Xo‘jayli", 'Taxiatosh', "Qo‘ng‘irot"],
  },
  
  // Narxlash tizimi
  pricing: {
    baseSeatPrice: 30000,
    pickupFee: 5000,
    dropoffFee: 5000, // Uyigacha eltish
    total: 0,
    etaMin: null,
    distanceKm: null,
  },

  // Premium Mijozlar
  premiumClients: [], 

  // Qisman ketish (Premium strategiyasi)
  partialDeparture: {
    enabled: false,
    strategy: 'immediate', 
  },

  lastError: null,

  // ==========================================
  // BARCHA QULAYLIKLAR VA XIZMATLAR STATE-LARI
  // ==========================================
  
  // 1. Avtomobil qulayliklari
  hasAC: false,        // Konditsioner
  hasTrunk: false,     // Bagaj (Bo'sh yukxona)
  isLux: false,        // Lux avtomobil

  // 2. Butun salon xizmati
  allowFullSalon: false,
  fullSalonPrice: 0,

  // 3. Eltish va Yuk (Siz tahrirlagan qismlar)
  hasEltish: false,
  eltishPrice: 0,
  hasYuk: false,
  yukPrice: 0,

  // 4. Xavfsizlik
  femaleOnly: false,   // Faqat ayollar uchun
};

export function pricingReducer(state, action) {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.mode };

    case 'SET_DRIVER_LOC':
      return { ...state, driverLoc: action.loc };

    case 'RESET':
      return { ...initialState, mode: state.mode };

    // O'rindiqlar
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

    // Yo'lovchilar
    case 'SET_PASSENGERS':
      return { ...state, passengers: action.passengers || [] };

    case 'ADD_PASSENGER':
      return { ...state, passengers: [ ...state.passengers, action.passenger ] };

    case 'REMOVE_PASSENGER':
      return { ...state, passengers: state.passengers.filter(p => p.id !== action.id) };

    // Narx va Yo'nalish
    case 'SET_ROUTE':
      return { ...state, route: { ...state.route, ...(action.route || {}) } };

    case 'SET_PRICING':
      return { ...state, pricing: { ...state.pricing, ...(action.pricing || {}) } };

    // Premium
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

    case 'SET_PARTIAL_DEPARTURE': {
      return { 
        ...state, 
        partialDeparture: { 
          ...state.partialDeparture, 
          ...(typeof action.val === 'object' ? action.val : { enabled: !!action.val }) 
        } 
      };
    }

    // ==========================================
    // BARCHA QULAYLIKLAR UCHUN CASE-LAR
    // ==========================================
    
    // 1. Avtomobil qulayliklari (AC, Trunk, Lux)
    case 'SET_HAS_AC':
      return { ...state, hasAC: !!action.val };

    case 'SET_HAS_TRUNK':
      return { ...state, hasTrunk: !!action.val };

    case 'SET_IS_LUX':
      return { ...state, isLux: !!action.val };

    // 2. Butun salon
    case 'SET_ALLOW_FULL_SALON':
      return { ...state, allowFullSalon: !!action.val };

    case 'SET_FULL_SALON_PRICE':
      return { ...state, fullSalonPrice: Math.max(0, Number(action.price) || 0) };

    // 3. Eltish (Pochta)
    case 'SET_HAS_ELTISH':
      return { ...state, hasEltish: !!action.val };

    case 'SET_ELTISH_PRICE':
      return { ...state, eltishPrice: Math.max(0, Number(action.price) || 0) };

    // 4. Yuk
    case 'SET_HAS_YUK':
      return { ...state, hasYuk: !!action.val };

    case 'SET_YUK_PRICE':
      return { ...state, yukPrice: Math.max(0, Number(action.price) || 0) };

    // 5. Gender
    case 'SET_FEMALE_ONLY':
      return { ...state, femaleOnly: !!action.val };

    case 'SET_ERROR':
      return { ...state, lastError: action.error };

    default:
      return state;
  }
}