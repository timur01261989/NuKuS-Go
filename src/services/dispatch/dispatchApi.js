import * as ordersApi from "@/services/ordersApi";

export async function dispatchOrder(orderId, limit = 20, radiusKm = 25, excludedDriverIds = []) {
  if (typeof window === "undefined") return null;

  const response = await fetch(
    `${(import.meta?.env?.VITE_API_BASE || "").replace(/\/$/, "")}/api/dispatch-match`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: orderId,
        limit,
        radius_km: radiusKm,
        excluded_driver_ids: excludedDriverIds,
      }),
    }
  ).catch(() => null);

  if (!response) return null;
  const json = await response.json().catch(() => null);
  return json;
}

export { ordersApi };
export default { dispatchOrder, ...ordersApi };


export async function enqueueDispatchJob(order) {
  if (!order?.id) return null;

  const response = await fetch(
    `${(import.meta?.env?.VITE_API_BASE || "").replace(/\/$/, "")}/api/dispatch-enqueue`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: order.id,
        service_type: order.service_type || "taxi",
        pickup_lat: order.pickup_lat ?? null,
        pickup_lng: order.pickup_lng ?? null,
        radius_km: order.radius_km ?? 3,
        wave: order.wave ?? 1,
      }),
    }
  ).catch(() => null);

  if (!response) return null;
  return response.json().catch(() => null);
}


export async function fetchDemandPredictions(limit = 50) {
  const response = await fetch(
    `${(import.meta?.env?.VITE_API_BASE || "").replace(/\/$/, "")}/api/dispatch-predictions?limit=${limit}`
  ).catch(() => null);

  if (!response) return [];
  const json = await response.json().catch(() => null);
  return json?.rows || [];
}


export async function getCityDispatchInfo(city){
 const res=await fetch(`/api/city-dispatch?city=${city}`)
 return res.json()
}


export async function fetchEventStream(streamType = "dispatch", limit = 100) {
  const res = await fetch(`/api/event-stream?stream_type=${encodeURIComponent(streamType)}&limit=${limit}`);
  return res.json();
}


export async function fetchDynamicPricing(payload) {
  const res = await fetch("/api/pricing-dynamic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function fetchCityDispatchInfo(city) {
  const res = await fetch(`/api/city-dispatch?city=${encodeURIComponent(city)}`);
  return res.json();
}


export async function fetchDispatchArchitecture() {
  const res = await fetch("/api/dispatch-architecture");
  return res.json();
}
