const SAVED_ADDRESSES_KEY = 'savedAddresses_v1';
const SAVED_PLACES_KEY = 'client_saved_places';
const TAXI_SHORTCUTS_KEY = 'taxiShortcuts';
const ACTIVE_ORDER_ID_KEY = 'activeOrderId';

function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function loadMyAddressesV1() {
  const arr = safeParse(localStorage.getItem(SAVED_ADDRESSES_KEY), []);
  return Array.isArray(arr) ? arr : [];
}

export function loadSavedPlaces() {
  const arr = safeParse(localStorage.getItem(SAVED_PLACES_KEY), []);
  return Array.isArray(arr) ? arr : [];
}

export function savePlace(place) {
  const list = loadSavedPlaces();
  const exists = list.find((item) => item.id === place.id);
  const next = exists ? list.map((item) => (item.id === place.id ? place : item)) : [place, ...list].slice(0, 20);
  localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(next));
  return next;
}

export function loadTaxiShortcuts() {
  const data = safeParse(localStorage.getItem(TAXI_SHORTCUTS_KEY), {});
  return { home: data?.home ?? null, work: data?.work ?? null };
}

export function getActiveOrderId() {
  return String(localStorage.getItem(ACTIVE_ORDER_ID_KEY) || '').trim() || null;
}

export function setActiveOrderId(orderId) {
  if (orderId) localStorage.setItem(ACTIVE_ORDER_ID_KEY, String(orderId));
  else localStorage.removeItem(ACTIVE_ORDER_ID_KEY);
}
