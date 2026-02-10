// Hozircha fake. Keyin supabase / api / websocketga ulaysiz.
export async function searchDriversNearby({ center, radiusMeters }) {
  const [lat, lng] = center || [];
  if (lat == null || lng == null) return [];

  // TODO: real query
  // masalan: supabase: drivers where online=true and distance < radiusMeters

  // Fake demo:
  await new Promise((r) => setTimeout(r, 150));

  // random 0-3 drivers
  const count = Math.floor(Math.random() * 4);
  return Array.from({ length: count }).map((_, i) => ({
    id: `${Date.now()}-${i}`,
    lat: lat + (Math.random() - 0.5) * 0.01,
    lng: lng + (Math.random() - 0.5) * 0.01
  }));
}
