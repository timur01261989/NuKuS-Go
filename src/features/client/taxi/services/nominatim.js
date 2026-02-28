// Centralized Nominatim search to avoid duplicate declarations and keep behavior consistent.
// NOTE: Do not shorten or remove fields - ClientTaxiPage expects full objects.
export async function nominatimSearch(q, signal) {
  const query = (q || "").trim();
  if (!query) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=1&countrycodes=uz&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Accept-Language": "uz,ru,en",
    },
    signal,
  });
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data;
}
