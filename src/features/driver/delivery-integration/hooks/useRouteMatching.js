import { useMemo } from "react";

function toRad(v) { return (v * Math.PI) / 180; }

export function haversineKm(a, b) {
  if (!a || !b) return 0;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * (Math.sin(dLng / 2) ** 2);
  const c = 2 * Math.atan2(Math.sqrt(s1 + s2), Math.sqrt(1 - (s1 + s2)));
  return R * c;
}

function pointToSegmentKm(p, a, b) {
  const lat = toRad(p[0]);
  const x = toRad(p[1]) * Math.cos(lat);
  const y = lat;

  const latA = toRad(a[0]);
  const xA = toRad(a[1]) * Math.cos(latA);
  const yA = latA;

  const latB = toRad(b[0]);
  const xB = toRad(b[1]) * Math.cos(latB);
  const yB = latB;

  const dx = xB - xA;
  const dy = yB - yA;
  const t = dx === 0 && dy === 0 ? 0 : ((x - xA) * dx + (y - yA) * dy) / (dx * dx + dy * dy);
  const tt = Math.max(0, Math.min(1, t));
  const xP = xA + tt * dx;
  const yP = yA + tt * dy;

  const d = Math.sqrt((x - xP) ** 2 + (y - yP) ** 2);
  return d * 6371;
}

export function computeDeviationKm(routePoints, point) {
  if (!routePoints || routePoints.length < 2 || !point) return Infinity;
  let best = Infinity;
  for (let i = 0; i < routePoints.length - 1; i++) {
    const d = pointToSegmentKm(point, routePoints[i], routePoints[i + 1]);
    if (d < best) best = d;
  }
  return best;
}

export function useRouteMatching({
  parcels,
  enabled,
  driverMode,
  onlyMyRoute,
  routePoints,
  driverLoc,
  radiusKm,
  deviationKm = 2,
  capacity = "M",
}) {
  return useMemo(() => {
    if (!enabled) return [];
    const list = Array.isArray(parcels) ? parcels : [];

    const capacityRank = { M: 1, L: 2, XL: 3 };
    const needRank = (x) => {
      const w = String(x || "").toUpperCase();
      if (w === "XL") return 3;
      if (w === "L") return 2;
      return 1;
    };
    const capOk = (p) => {
      const need = needRank(p?.capacity || p?.size || "M");
      return (capacityRank[capacity] || 1) >= need;
    };

    if (driverMode === "CITY") {
      return list
        .filter(capOk)
        .filter((p) => {
          const pick = p?.pickup_location;
          const pt = pick ? [Number(pick.lat), Number(pick.lng)] : null;
          if (!pt || !driverLoc) return false;
          return haversineKm(driverLoc, pt) <= (radiusKm || 5);
        });
    }

    // Inter modes
    if (!onlyMyRoute) return list.filter(capOk);

    return list
      .filter(capOk)
      .filter((p) => {
        const pick = p?.pickup_location;
        const drop = p?.drop_location;
        const p1 = pick ? [Number(pick.lat), Number(pick.lng)] : null;
        const p2 = drop ? [Number(drop.lat), Number(drop.lng)] : null;
        if (!p1 || !p2) return false;
        if (!routePoints || routePoints.length < 2) return true;

        const d1 = computeDeviationKm(routePoints, p1);
        const d2 = computeDeviationKm(routePoints, p2);
        return d1 <= deviationKm || d2 <= deviationKm;
      });
  }, [
    enabled,
    driverMode,
    onlyMyRoute,
    JSON.stringify(routePoints || []),
    JSON.stringify(driverLoc || []),
    radiusKm,
    deviationKm,
    capacity,
    JSON.stringify(parcels || []),
  ]);
}
