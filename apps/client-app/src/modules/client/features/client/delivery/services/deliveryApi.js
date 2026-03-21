
import { nominatimReverse as _nominatimReverse } from "../../shared/geo/nominatim";
import api from "@/modules/shared/utils/apiHelper";
import { normalizeDeliveryOrder, normalizeDeliveryStatus } from "@/modules/shared/domain/delivery/statusMap.js";

function normalizeOrderResponse(response) {
  const order = response?.order || response?.data?.order || response?.data || null;
  return order ? { ...response, order: normalizeDeliveryOrder(order) } : response;
}

export const deliveryApi = {
  create: async (payload) => normalizeOrderResponse(await api.post("/api/delivery", { action: "create_order", payload })),
  status: async (orderId) => normalizeOrderResponse(await api.post("/api/delivery", { action: "list_my_orders", orderId })),
  cancel: async (orderId, reason = "") =>
    normalizeOrderResponse(
      await api.post("/api/delivery", {
        action: "update_order",
        id: orderId,
        patch: { status: normalizeDeliveryStatus("canceled"), cancel_reason: reason },
      })
    ),
  updateStatus: async (orderId, status, extra = {}) =>
    normalizeOrderResponse(await api.post("/api/delivery", { action: "driver_update_status", id: orderId, status: normalizeDeliveryStatus(status), patch: extra })),
  active: async () => {
    const response = await api.post("/api/delivery", { action: "list_my_orders" });
    const orders = Array.isArray(response?.orders) ? response.orders.map(normalizeDeliveryOrder) : [];
    return { ...response, orders, order: orders.find((item) => !["delivered", "canceled"].includes(item.status)) || null };
  },
};

export async function nominatimReverse(lat, lng, signal) {
  return _nominatimReverse(lat, lng, { signal, swallowErrors: false });
}
