/**
 * Geo Web Worker — Offloads heavy calculations from main thread
 * Prevents UI freeze during routing, distance calculations
 * Usage: new Worker('/workers/geo.worker.js')
 */

type WorkerMessage =
  | { type: "haversine";  data: { from: [number,number]; to: [number,number] } }
  | { type: "batch_eta";  data: { drivers: Array<{id:string;lat:number;lng:number}>; pickup: [number,number] } }
  | { type: "h3_cell";    data: { lat: number; lng: number; res: number } }
  | { type: "surge_zone"; data: { points: Array<{lat:number;lng:number;demand:number}> } };

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toR = (d: number) => d * Math.PI / 180;
  const dLat = toR(lat2 - lat1);
  const dLng = toR(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Handle messages from main thread
self.addEventListener("message", (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data;

  if (type === "haversine") {
    const dist = haversineKm(data.from[0], data.from[1], data.to[0], data.to[1]);
    self.postMessage({ type: "haversine_result", dist });
  }

  if (type === "batch_eta") {
    // Compute ETA for all nearby drivers in parallel (no blocking)
    const results = [];
    for (let i = 0; i < data.drivers.length; i++) {
      const d = data.drivers[i];
      const distKm = haversineKm(d.lat, d.lng, data.pickup[0], data.pickup[1]);
      const eta    = (distKm / 35) * 60 + 2.5;  // 35 km/h avg
      results.push({ driver_id: d.id, dist_km: distKm, eta_min: Math.round(eta * 10) / 10 });
    }
    // Sort by ETA
    results.sort((a, b) => a.eta_min - b.eta_min);
    self.postMessage({ type: "batch_eta_result", results });
  }

  if (type === "h3_cell") {
    // Stub H3 — in production use h3-js in worker
    const cell = `89${data.res}${Math.round(data.lat*100).toString(16)}${Math.round(data.lng*100).toString(16)}`;
    self.postMessage({ type: "h3_result", cell });
  }

  if (type === "surge_zone") {
    // Aggregate demand points into surge zones
    const zones: Record<string, { count: number; avg_demand: number }> = {};
    for (const p of data.points) {
      // Grid-based zone (0.01 degree ≈ 1km)
      const zoneKey = `${Math.round(p.lat * 100)}_${Math.round(p.lng * 100)}`;
      if (!zones[zoneKey]) zones[zoneKey] = { count: 0, avg_demand: 0 };
      zones[zoneKey].count++;
      zones[zoneKey].avg_demand = (zones[zoneKey].avg_demand + p.demand) / 2;
    }
    self.postMessage({ type: "surge_zones_result", zones });
  }
});
