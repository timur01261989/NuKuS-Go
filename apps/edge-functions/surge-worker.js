/**
 * Cloudflare Worker — Edge Surge Pricing
 * Deployed to 200+ PoPs worldwide for <5ms latency
 *
 * Deploy: wrangler deploy apps/edge-functions/surge-worker.js
 */

export default {
  async fetch(request, env) {
    const url    = new URL(request.url);
    const cors   = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

    if (request.method === "OPTIONS")
      return new Response(null, { headers: { ...cors, "Access-Control-Allow-Methods": "POST,GET" } });

    if (url.pathname === "/edge/surge") {
      const body = await request.json().catch(() => ({}));

      // KV cache lookup (edge-cached surge data)
      const cacheKey = `surge:${Math.round((body.lat || 41.3) * 100)}:${Math.round((body.lng || 69.2) * 100)}`;
      const cached   = await env.SURGE_KV?.get(cacheKey, "json").catch(() => null);

      if (cached) {
        return new Response(JSON.stringify({ ...cached, cached: true, edge: true }), { headers: cors });
      }

      // Compute at edge (lightweight version)
      const hour     = new Date().getUTCHours() + 5; // UTC+5
      const isRush   = (hour >= 7 && hour < 10) || (hour >= 17 && hour < 21);
      const demand   = body.pending_orders || 0;
      const supply   = Math.max(1, body.active_drivers || 10);
      const ratio    = demand / supply;

      let surge = 1.0;
      if (ratio > 3)     surge = 2.0;
      else if (ratio > 2) surge = 1.5;
      else if (ratio > 1.2) surge = 1.2;
      if (isRush) surge = Math.min(surge * 1.1, 2.5);

      const result = {
        surge_factor: Math.round(surge * 100) / 100,
        zone:         surge > 1.5 ? "surge" : surge > 1.2 ? "busy" : "normal",
        cached:       false,
        edge:         true,
        region:       request.cf?.colo || "unknown",
      };

      // Cache for 30s at edge
      await env.SURGE_KV?.put(cacheKey, JSON.stringify(result), { expirationTtl: 30 }).catch(() => null);

      return new Response(JSON.stringify(result), { headers: cors });
    }

    if (url.pathname === "/edge/eta") {
      const { pickup, dropoff, hour } = await request.json().catch(() => ({}));
      if (!pickup?.lat || !dropoff?.lat)
        return new Response(JSON.stringify({ error: "pickup/dropoff required" }), { status: 400, headers: cors });

      // Haversine at edge
      const R = 6371, toR = d => d * Math.PI / 180;
      const dLat = toR(dropoff.lat - pickup.lat);
      const dLng = toR(dropoff.lng - pickup.lng);
      const a = Math.sin(dLat/2)**2 + Math.cos(toR(pickup.lat))*Math.cos(toR(dropoff.lat))*Math.sin(dLng/2)**2;
      const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      const h = hour ?? new Date().getUTCHours() + 5;
      const isRush = (h >= 7 && h < 10) || (h >= 17 && h < 21);
      const speed  = 35 / (isRush ? 1.9 : 1.0);
      const eta    = (distKm / speed) * 60 + 2.5;

      return new Response(JSON.stringify({
        eta_minutes: Math.round(eta * 10) / 10,
        distance_km: Math.round(distKm * 100) / 100,
        edge: true,
        region: request.cf?.colo || "unknown",
      }), { headers: cors });
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: cors });
  },
};
