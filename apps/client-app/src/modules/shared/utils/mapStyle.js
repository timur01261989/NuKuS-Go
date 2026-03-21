// Map style loader (works for MapLibre). For Leaflet you can ignore this.
export async function getMapStyle() {
  try {
    const r = await fetch('/map/style.json');
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}
