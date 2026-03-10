import { useEffect, useRef } from "react";

export async function nominatimSearch(q, signal) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=7&addressdetails=1&q=${encodeURIComponent(q)}&countrycodes=uz`;
  try {
    const res = await fetch(url, { signal, headers: { "Accept-Language": "uz,ru,en" } });
    const data = await res.json();
    return (data || []).map((x) => ({
      id: x.place_id,
      label: x.display_name,
      address: x.display_name,
      lat: parseFloat(x.lat),
      lng: parseFloat(x.lon),
    }));
  } catch (e) {
    if (e?.name === "AbortError") return [];
    return [];
  }
}

export function useTaxiSearch({ searchOpen, pickupSearchText, destSearchText, setPickupResults, setDestResults, setSearchBusy }) {
  const pickupAbortRef = useRef(null);
  const destAbortRef = useRef(null);

  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(async () => {
      const q = pickupSearchText.trim();
      if (!q) {
        setPickupResults([]);
        return;
      }
      if (pickupAbortRef.current) pickupAbortRef.current.abort();
      const ac = new AbortController();
      pickupAbortRef.current = ac;
      setSearchBusy(true);
      const res = await nominatimSearch(q, ac.signal);
      setPickupResults(res);
      setSearchBusy(false);
    }, 250);
    return () => clearTimeout(t);
  }, [pickupSearchText, searchOpen, setPickupResults, setSearchBusy]);

  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(async () => {
      const q = destSearchText.trim();
      if (!q) {
        setDestResults([]);
        return;
      }
      if (destAbortRef.current) destAbortRef.current.abort();
      const ac = new AbortController();
      destAbortRef.current = ac;
      setSearchBusy(true);
      const res = await nominatimSearch(q, ac.signal);
      setDestResults(res);
      setSearchBusy(false);
    }, 250);
    return () => clearTimeout(t);
  }, [destSearchText, searchOpen, setDestResults, setSearchBusy]);
}
