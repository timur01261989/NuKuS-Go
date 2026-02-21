/** Nominatim search + reverse with AbortController support */
export async function nominatimSearch(q, signal) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=7&addressdetails=1&q=${encodeURIComponent(q)}&countrycodes=uz`;
  try {
    const res = await fetch(url, { signal, headers: { "Accept-Language": "uz,ru,en" } });
    const data = await res.json();
    return (data || []).map((x) => ({
      id: x.place_id,
      label: x.display_name,
      lat: parseFloat(x.lat),
      lng: parseFloat(x.lon),
    }));
  } catch (e) {
    if (e?.name === "AbortError") return [];
    return [];
  }
}

export async function nominatimReverse(lat, lng, signal) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
  try {
    const res = await fetch(url, { signal, headers: { "Accept-Language": "uz,ru,en" } });
    const data = await res.json();
    return data?.display_name || "";
  } catch (e) {
    if (e?.name === "AbortError") return "";
    return "";
  }
}
