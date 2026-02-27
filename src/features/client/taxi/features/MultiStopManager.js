/** Waypoints manager (add/remove/reorder) */
export function addStop(stops, stop) {
  const next = Array.isArray(stops) ? [...stops] : [];
  next.push(stop);
  return next;
}
export function removeStop(stops, idx) {
  const next = Array.isArray(stops) ? [...stops] : [];
  next.splice(idx, 1);
  return next;
}
