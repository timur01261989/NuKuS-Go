// src/features/map/utils/nearestPointIndex.js
function dist2(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx*dx + dy*dy;
}

/**
 * nearestPointIndex
 * pointsLatLng: [ [lat,lng], ... ]
 * center: { lat, lng }
 */
export function nearestPointIndex(pointsLatLng, center) {
  if (!Array.isArray(pointsLatLng) || !pointsLatLng.length || !center) return 0;
  const c = [Number(center.lat), Number(center.lng)];
  let bestI = 0;
  let best = Infinity;
  for (let i=0;i<pointsLatLng.length;i++) {
    const p = pointsLatLng[i];
    const d = dist2([Number(p[0]), Number(p[1])], c);
    if (d < best) { best = d; bestI = i; }
  }
  return bestI;
}