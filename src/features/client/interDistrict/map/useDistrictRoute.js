import { useEffect, useMemo, useState } from "react";
import { findDistrict, haversineKm, estimateDistrictPrice } from "../services/districtData";

/**
 * useDistrictRoute.js (Client)
 * -------------------------------------------------------
 * Marshrut:
 * - standard (pitak): region + fromDistrict + toDistrict (tuman markazlari)
 * - door-to-door: pickupPoint / dropoffPoint (xaritadan)
 *
 * Natija:
 * - distanceKm
 * - durationMin
 * - polyline (OSRM geojson coords -> [[lat,lng],...])
 */
async function osrmRoute(fromPoint, toPoint) {
  const url = `https://router.project-osrm.org/route/v1/driving/${fromPoint.lng},${fromPoint.lat};${toPoint.lng},${toPoint.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("OSRM route error");
  const j = await res.json();
  const r = j?.routes?.[0];
  if (!r) throw new Error("No route");
  const distanceKm = (r.distance || 0) / 1000;
  const durationMin = (r.duration || 0) / 60;
  const coords = r.geometry?.coordinates || [];
  const polyline = coords.map(([lng, lat]) => [lat, lng]);
  return { distanceKm, durationMin, polyline };
}

export function useDistrictRoute({
  regionId,
  fromDistrictName,
  toDistrictName,
  doorToDoor,
  pickupPoint,
  dropoffPoint,
}) {
  const [distanceKm, setDistanceKm] = useState(null);
  const [durationMin, setDurationMin] = useState(null);
  const [price, setPrice] = useState(null);
  const [polyline, setPolyline] = useState(null);

  const fromDistrict = useMemo(() => (fromDistrictName ? findDistrict(regionId, fromDistrictName) : null), [regionId, fromDistrictName]);
  const toDistrict = useMemo(() => (toDistrictName ? findDistrict(regionId, toDistrictName) : null), [regionId, toDistrictName]);

  const routeFrom = useMemo(() => {
    if (doorToDoor) return pickupPoint || null;
    return fromDistrict ? { lat: fromDistrict.lat, lng: fromDistrict.lng } : null;
  }, [doorToDoor, pickupPoint, fromDistrict]);

  const routeTo = useMemo(() => {
    if (doorToDoor) {
      if (dropoffPoint) return dropoffPoint;
      // dropoff optional: fallback to "toDistrict" markazi agar tanlangan bo‘lsa
      return toDistrict ? { lat: toDistrict.lat, lng: toDistrict.lng } : null;
    }
    return toDistrict ? { lat: toDistrict.lat, lng: toDistrict.lng } : null;
  }, [doorToDoor, dropoffPoint, toDistrict]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!routeFrom || !routeTo) {
        setDistanceKm(null);
        setDurationMin(null);
        setPolyline(null);
        setPrice(null);
        return;
      }
      try {
        const r = await osrmRoute(routeFrom, routeTo);
        if (cancelled) return;
        setDistanceKm(r.distanceKm);
        setDurationMin(r.durationMin);
        setPolyline(r.polyline);
        setPrice(estimateDistrictPrice(r.distanceKm));
      } catch (e) {
        // fallback: haversine
        const d = haversineKm(routeFrom, routeTo);
        if (cancelled) return;
        setDistanceKm(d);
        setDurationMin((d / 50) * 60);
        setPolyline([
          [routeFrom.lat, routeFrom.lng],
          [routeTo.lat, routeTo.lng],
        ]);
        setPrice(estimateDistrictPrice(d));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [routeFrom?.lat, routeFrom?.lng, routeTo?.lat, routeTo?.lng]);

  return {
    from: routeFrom,
    to: routeTo,
    distanceKm,
    durationMin,
    price,
    polyline,
    fromDistrict,
    toDistrict,
  };
}
