const KEY = 'nukusgo_market_listings_v1';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function save(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
}

export function getAllListings() {
  return load();
}

export function addListing(listing) {
  const items = load();
  items.unshift(listing);
  save(items);
  return listing;
}

export function clearListings() {
  localStorage.removeItem(KEY);
}
