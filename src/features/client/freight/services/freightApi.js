import api from "@/utils/apiHelper";

export async function nominatimReverse(lat, lng, signal) {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&addressdetails=1&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}`;
  const res = await fetch(url, { signal, headers: { "Accept-Language": "uz,ru,en" } });
  const data = await res.json();
  return data?.display_name || "";
}

export async function createFreightOrder(payload) {
  return api.post("/api/order", { action: "create_freight", ...payload });
}

export async function cancelFreightOrder(orderId) {
  return api.post("/api/order", { action: "cancel", orderId });
}

export async function freightStatus(orderId) {
  return api.post("/api/order", { action: "status", orderId });
}
