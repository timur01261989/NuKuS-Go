function cellKey(lat, lng, precision = 2) {
  return `${Number(lat).toFixed(precision)}:${Number(lng).toFixed(precision)}`;
}

export function aggregateDemandHeatmap(orders = []) {
  const map = new Map();
  for (const order of Array.isArray(orders) ? orders : []) {
    const lat = order?.pickup?.lat;
    const lng = order?.pickup?.lng;
    if (lat == null || lng == null) continue;
    const key = cellKey(lat, lng);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries()).map(([key, count]) => {
    const [lat, lng] = key.split(':').map(Number);
    return { lat, lng, demand: count };
  }).sort((a, b) => b.demand - a.demand);
}
