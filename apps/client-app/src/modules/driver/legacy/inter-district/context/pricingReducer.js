/**
 * pricingReducer.js
 * -------------------------------------------------------
 * Tumanlararo qatnov tizimining markaziy Reducer'i.
 * * BARCHA FUNKSIYALAR:
 * - Standart / Premium rejimlar
 * - O'rindiqlar va ularning alohida narxlari
 * - Yo'lovchi, Eltish (Pochta) va Yuk (Bagaj)
 * - Avtomobil qulayliklari (AC, Trunk, Lux)
 * - Xizmatlar (Pickup, Dropoff, Full Salon)
 * - Gender xavfsizligi (Female Only)
 */

export const MODES = {
  STANDARD: 'STANDARD',
  PREMIUM: 'PREMIUM',
};

export const initialState = {
  mode: MODES.STANDARD,
  driverLoc: null, // [lat,lng]
  
  // 4 ta o'rindiq holati
  seats: {
    FL: { taken: false, price: 0, label: 'Old chap' },
    FR: { taken: false, price: 0, label: 'Old o‘ng' },
    RL: { taken: false, price: 0, label: 'Orqa chap' },
    RR: { taken: false, price: 0, label: 'Orqa o‘ng' },
  },
  
  passengers: [], // {id, name, phone, seatKey, pickupAddress?}
  
  // Yo'nalish
  route: {
    from: 'Nukus Avtovokzal',
    to: "Qo‘ng‘irot Markaz",
    stops: ['Nukus', "Xo‘jayli", 'Taxiatosh', "Qo‘ng‘irot"],
  },
  
  // Narxlash va to'lovlar
  pricing: {
    baseSeatPrice: 30000,
    pickupFee: 5000,    // Uyidan olish narxi
    dropoffFee: 5000,   // Manziliga tashlab qo'yish narxi
    total: 0,
    etaMin: null,
    distanceKm: null,
  },

  // Premium va Rejimlar
  premiumClients: [], 
  partialDeparture: {
    enabled: false,
    strategy: 'immediate', 
  },

  lastError: null,

  // ==========================================
  // QULAYLIKLAR VA XIZMATLAR (TO'LIQ RO'YXAT)
  // ==========================================
  
  // 1. Avtomobil parametrlari
  hasAC: false,        // Konditsioner (❄️)
  hasTrunk: false,     // Katta yukxona (🧳)
  isLux: false,        // Lyuks klass (✨)

  // 2. Butun salonni sotish
  allowFullSalon: false,
  fullSalonPrice: 0,

  // 3. Eltish va Yuk (Pochta xizmatlari)
  hasEltish: false,    // Pochta/Poshilka (📦)
  eltishPrice: 0,
  hasYuk: false,       // Katta yuk/Bagaj (🚚)
  yukPrice: 0,

  // 4. Xavfsizlik va Gender
  femaleOnly: false,   // Faqat ayollar uchun (👩)
};

export function pricingReducer(state, action) {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.mode };

    case 'SET_DRIVER_LOC':
      return { ...state, driverLoc: action.loc };

    case 'RESET':
      return { ...initialState, mode: state.mode };

    // --- O'rindiqlar boshqaruvi ---
    case 'TOGGLE_SEAT': {
      const key = action.key;
      const seat = state.seats[key];
      if (!seat) return state;
      return { 
        ...state, 
        seats: { ...state.seats, [key]: { ...seat, taken: !seat.taken } } 
      };
    }

    case 'SET_SEAT_PRICE': {
      const { key, price } = action;
      const seat = state.seats[key];
      if (!seat) return state;
      return { 
        ...state, 
        seats: { ...state.seats, [key]: { ...seat, price: Math.max(0, Number(price) || 0) } } 
      };
    }

    // --- Yo'lovchilar ---
    case 'SET_PASSENGERS':
      return { ...state, passengers: action.passengers || [] };

    case 'ADD_PASSENGER':
      return { ...state, passengers: [ ...state.passengers, action.passenger ] };

    case 'REMOVE_PASSENGER':
      return { ...state, passengers: state.passengers.filter(p => p.id !== action.id) };

    // --- Narx va Marshrut ---
    case 'SET_ROUTE':
      return { ...state, route: { ...state.route, ...(action.route || {}) } };

    case 'SET_PRICING':
      return { ...state, pricing: { ...state.pricing, ...(action.pricing || {}) } };

    // --- Premium Mijozlar ---
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

    // ==========================================
    // BARCHA QULAYLIKLAR UCHUN CASE-LAR (TIKLANGAN)
    // ==========================================
    
    // 1. Avtomobil qulayliklari
    case 'SET_HAS_AC':
      return { ...state, hasAC: !!action.val };

    case 'SET_HAS_TRUNK':
      return { ...state, hasTrunk: !!action.val };

    case 'SET_IS_LUX':
      return { ...state, isLux: !!action.val };

    // 2. Butun salonni band qilish
    case 'SET_ALLOW_FULL_SALON':
      return { ...state, allowFullSalon: !!action.val };

    case 'SET_FULL_SALON_PRICE':
      return { ...state, fullSalonPrice: Math.max(0, Number(action.price) || 0) };

    // 3. Eltish (Pochta)
    case 'SET_HAS_ELTISH':
      return { ...state, hasEltish: !!action.val };

    case 'SET_ELTISH_PRICE':
      return { ...state, eltishPrice: Math.max(0, Number(action.price) || 0) };

    // 4. Yuk olaman
    case 'SET_HAS_YUK':
      return { ...state, hasYuk: !!action.val };

    case 'SET_YUK_PRICE':
      return { ...state, yukPrice: Math.max(0, Number(action.price) || 0) };

    // 5. Gender xavfsizligi
    case 'SET_FEMALE_ONLY':
      return { ...state, femaleOnly: !!action.val };

    case 'SET_PARTIAL_DEPARTURE': {
      return { 
        ...state, 
        partialDeparture: { 
          ...state.partialDeparture, 
          ...(typeof action.val === 'object' ? action.val : { enabled: !!action.val }) 
        } 
      };
    }

    case 'SET_ERROR':
      return { ...state, lastError: action.error };

    default:
      return state;
  }
}