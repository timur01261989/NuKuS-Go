import taxiLogger from "../../../../../shared/taxi/utils/taxiLogger";

export function loadMyAddressesV1() {
  try {
    const raw = localStorage.getItem("savedAddresses_v1");
    const arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr)) return arr;
  } catch (error) {
    taxiLogger.warn("client.taxi.storage.load_addresses_failed", { error });
  }
  return [];
}

export function loadSavedPlaces() {
  try {
    const raw = localStorage.getItem("client_saved_places");
    const arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr)) return arr;
  } catch (error) {
    taxiLogger.warn("client.taxi.storage.load_places_failed", { error });
  }
  return [];
}

export function savePlace(place) {
  const list = loadSavedPlaces();
  const exists = list.find((x) => x.id === place.id);
  const next = exists ? list.map((x) => (x.id === place.id ? place : x)) : [place, ...list].slice(0, 20);
  localStorage.setItem("client_saved_places", JSON.stringify(next));
  return next;
}

export function loadTaxiShortcuts() {
  try {
    const raw = localStorage.getItem("taxiShortcuts") || '{}';
    const parsed = JSON.parse(raw);
    return { home: parsed.home || null, work: parsed.work || null };
  } catch (error) {
    taxiLogger.warn("client.taxi.storage.shortcuts_failed", { error });
    return { home: null, work: null };
  }
}
