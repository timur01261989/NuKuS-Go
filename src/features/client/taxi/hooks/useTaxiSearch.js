import { useEffect, useRef, useState } from 'react';

export async function nominatimSearch(q, signal) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=7&addressdetails=1&q=${encodeURIComponent(q)}&countrycodes=uz`;
  try {
    const res = await fetch(url, { signal, headers: { 'Accept-Language': 'uz,ru,en' } });
    const data = await res.json();
    return (data || []).map((item) => ({
      id: item.place_id,
      label: item.display_name,
      address: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      raw: item,
    }));
  } catch (error) {
    if (error?.name === 'AbortError') return [];
    return [];
  }
}

export function useTaxiSearch({ searchOpen, pickupSearchText, destSearchText }) {
  const [pickupResults, setPickupResults] = useState([]);
  const [destResults, setDestResults] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const pickupAbortRef = useRef(null);
  const destAbortRef = useRef(null);

  useEffect(() => {
    if (!searchOpen) return undefined;
    const timer = setTimeout(async () => {
      const q = String(pickupSearchText || '').trim();
      if (!q) {
        setPickupResults([]);
        return;
      }
      if (pickupAbortRef.current) pickupAbortRef.current.abort();
      const ac = new AbortController();
      pickupAbortRef.current = ac;
      setSearchBusy(true);
      const result = await nominatimSearch(q, ac.signal);
      setPickupResults(result);
      setSearchBusy(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [pickupSearchText, searchOpen]);

  useEffect(() => {
    if (!searchOpen) return undefined;
    const timer = setTimeout(async () => {
      const q = String(destSearchText || '').trim();
      if (!q) {
        setDestResults([]);
        return;
      }
      if (destAbortRef.current) destAbortRef.current.abort();
      const ac = new AbortController();
      destAbortRef.current = ac;
      setSearchBusy(true);
      const result = await nominatimSearch(q, ac.signal);
      setDestResults(result);
      setSearchBusy(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [destSearchText, searchOpen]);

  return { pickupResults, destResults, searchBusy };
}
