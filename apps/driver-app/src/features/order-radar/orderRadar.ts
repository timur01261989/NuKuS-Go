export async function fetchNearbyOrders(lat: number, lng: number, radiusKm = 5) {
  const res = await fetch(`${process.env.API_BASE}/api/v1/ride/nearby?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`);
  const json = await res.json();
  return json.orders || [];
}
