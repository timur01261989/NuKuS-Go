import { useEffect, useMemo, useState } from 'react';
import { haversineKm } from '../../shared/geo/haversine';

export async function osrmRouteMulti(points) {
  if (!points || points.length < 2) return null;
  try {
    const pairs = points.filter(Boolean).map((point) => `${point[1]},${point[0]}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${pairs}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    const route = data?.routes?.[0];
    if (route) {
      const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      return {
        coords,
        distanceKm: (route.distance || 0) / 1000,
        durationMin: (route.duration || 0) / 60,
      };
    }
  } catch {
    // fallback below
  }
  const from = points[0];
  const to = points[points.length - 1];
  return {
    coords: [from, to],
    distanceKm: haversineKm(from, to),
    durationMin: haversineKm(from, to) * 2,
  };
}

export function useTaxiRouteBuilder({ step, pickup, dest, waypoints }) {
  const [route, setRoute] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (step !== 'route' && step !== 'coming') return;
      if (!pickup?.latlng || !dest?.latlng) {
        setRoute(null);
        return;
      }
      const points = [pickup.latlng, ...(Array.isArray(waypoints) ? waypoints.map((w) => w.latlng).filter(Boolean) : []), dest.latlng];
      const value = await osrmRouteMulti(points);
      if (!cancelled) setRoute(value);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [step, pickup?.latlng?.[0], pickup?.latlng?.[1], dest?.latlng?.[0], dest?.latlng?.[1], Array.isArray(waypoints) ? waypoints.length : 0]);

  const distanceKm = useMemo(() => route?.distanceKm || (pickup?.latlng && dest?.latlng ? haversineKm(pickup.latlng, dest.latlng) : 0), [route?.distanceKm, pickup?.latlng, dest?.latlng]);
  const durationMin = useMemo(() => route?.durationMin || (distanceKm ? distanceKm * 2 : 0), [route?.durationMin, distanceKm]);

  return { route, setRoute, distanceKm, durationMin };
}
