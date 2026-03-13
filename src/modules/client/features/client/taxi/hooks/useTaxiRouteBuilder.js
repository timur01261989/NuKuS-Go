import { useEffect } from "react";
import { haversineKm } from "../../shared/geo/haversine";

export async function osrmRouteMulti(points) {
  if (!points || points.length < 2) return null;
  try {
    const pairs = points.filter(Boolean).map((p) => `${p[1]},${p[0]}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${pairs}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    const r = data?.routes?.[0];
    if (r) {
      const coords = r.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      return {
        coords,
        distanceKm: (r.distance || 0) / 1000,
        durationMin: (r.duration || 0) / 60,
      };
    }
  } catch (e) {
    console.warn("OSRM yo'nalish chizishda xatolik:", e);
  }
  const from = points[0];
  const to = points[points.length - 1];
  return {
    coords: [from, to],
    distanceKm: haversineKm(from, to),
    durationMin: haversineKm(from, to) * 2,
  };
}

export function useTaxiRouteBuilder({ step, pickup, dest, waypoints, setRoute }) {
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (step !== "route" && step !== "coming") return;
      if (!pickup.latlng || !dest.latlng) {
        setRoute(null);
        return;
      }
      const pts = [pickup.latlng, ...waypoints.map((w) => w.latlng).filter(Boolean), dest.latlng];
      const r = await osrmRouteMulti(pts);
      if (!cancelled) setRoute(r);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [step, pickup.latlng?.[0], pickup.latlng?.[1], dest.latlng?.[0], dest.latlng?.[1], waypoints.length, setRoute]);
}
