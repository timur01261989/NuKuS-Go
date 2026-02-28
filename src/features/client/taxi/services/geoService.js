// src/features/client/taxi/services/geoService.js
// Geo utilitlar: masofa, reverse geocoding (Nominatim)

export function haversineKm(a, b) {
  if (!a || !b) return 0;
  const lat1 = Number(a[0]);
  const lon1 = Number(a[1]);
  const lat2 = Number(b[0]);
  const lon2 = Number(b[1]);
  if (![lat1, lon1, lat2, lon2].every((n) => Number.isFinite(n))) return 0;

  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const sLat1 = toRad(lat1);
  const sLat2 = toRad(lat2);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(sLat1) * Math.cos(sLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return 2 * R * Math.asin(Math.sqrt(h));
}

export async function nominatimReverse(lat, lng, signal) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;

  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      la
    )}&lon=${encodeURIComponent(ln)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Accept": "application/json" },
    signal,
  });
  if (!res.ok) return null;
  const data = await res.json();
  const label = data?.display_name || data?.name || null;

  return label
    ? { label, raw: data }
    : null;
}
