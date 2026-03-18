import { translateClientPhrase } from "../../shared/i18n_clientLocalize";
import { nominatimReverse as _nominatimReverse } from "../../shared/geo/nominatim";
import { useEffect, useRef, useState } from "react";

export const MAX_KM = 50;
export const tileDay = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
export const tileNight = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

export async function nominatimReverse(lat, lng, signal) {
  return _nominatimReverse(lat, lng, { signal });
}

export function getClientPhrase() {
  const currentLang = (() => {
    try {
      return localStorage.getItem("appLang") || "uz_lotin";
    } catch {
      return "uz_lotin";
    }
  })();
  return (x) => translateClientPhrase(currentLang, x);
}

export function createTaxiTariffs() {
  return [
    { id: "start", title: "Start", mult: 1, base: 4500, perKm: 1400 },
    { id: "comfort", title: "Komfort", mult: 1.2, base: 6500, perKm: 1700 },
    { id: "business", title: "Biznes", mult: 1.5, base: 9000, perKm: 2200 },
  ];
}

export function useDebouncedReverse(when, latlng, delay = 350) {
  const [addr, setAddr] = useState("");
  const abortRef = useRef(null);
  const tRef = useRef(null);

  useEffect(() => {
    if (!when || !latlng) return;

    if (tRef.current) clearTimeout(tRef.current);
    if (abortRef.current) abortRef.current.abort();

    const ac = new AbortController();
    abortRef.current = ac;

    tRef.current = setTimeout(async () => {
      const a = await nominatimReverse(latlng[0], latlng[1], ac.signal);
      setAddr(a || "");
    }, delay);

    return () => {
      if (tRef.current) clearTimeout(tRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [when, latlng?.[0], latlng?.[1], delay]);

  return addr;
}
