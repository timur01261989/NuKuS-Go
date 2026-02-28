/** Nominatim search + reverse with AbortController support */
import { nominatimSearch as _nominatimSearch, nominatimReverse as _nominatimReverse } from "../../shared/geo/nominatim";

export async function nominatimSearch(q, signal) {
  // Preserve previous behavior: swallow errors and return [] on abort/err
  return _nominatimSearch(q, { signal, swallowErrors: true });
}

export async function nominatimReverse(lat, lng, signal) {
  // Preserve previous behavior: swallow errors and return "" on abort/err
  return _nominatimReverse(lat, lng, { signal, swallowErrors: true });
}
