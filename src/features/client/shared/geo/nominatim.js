// Shared Nominatim helpers.
// IMPORTANT: keep callers' error-handling behavior via swallowErrors option.
const DEFAULT_ACCEPT_LANGUAGE = "uz,ru,en";
const DEFAULT_COUNTRY_CODES = "uz";

export async function nominatimSearch(q, options = {}) {
  const signal = options?.signal;
  const countrycodes = options?.countrycodes ?? DEFAULT_COUNTRY_CODES;
  const acceptLanguage = options?.acceptLanguage ?? DEFAULT_ACCEPT_LANGUAGE;

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=7&addressdetails=1&q=${encodeURIComponent(
    q
  )}&countrycodes=${encodeURIComponent(countrycodes)}`;

  const swallowErrors = options?.swallowErrors ?? true;

  try {
    const res = await fetch(url, { signal, headers: { "Accept-Language": acceptLanguage } });
    const data = await res.json();
    return (data || []).map((x) => ({
      id: x.place_id,
      label: x.display_name,
      lat: parseFloat(x.lat),
      lng: parseFloat(x.lon),
    }));
  } catch (e) {
    if (!swallowErrors) throw e;
    if (e?.name === "AbortError") return [];
    return [];
  }
}

export async function nominatimReverse(lat, lng, options = {}) {
  const signal = options?.signal;
  const zoom = options?.zoom ?? 18;
  const acceptLanguage = options?.acceptLanguage ?? DEFAULT_ACCEPT_LANGUAGE;
  const swallowErrors = options?.swallowErrors ?? true;

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&zoom=${encodeURIComponent(
    zoom
  )}&addressdetails=1&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;

  try {
    const res = await fetch(url, { signal, headers: { "Accept-Language": acceptLanguage } });
    const data = await res.json();
    return data?.display_name || "";
  } catch (e) {
    if (!swallowErrors) throw e;
    if (e?.name === "AbortError") return "";
    return "";
  }
}
