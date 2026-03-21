import api from "@/modules/shared/utils/apiHelper";
import { taxiLogger } from "../utils/taxiLogger.js";
import { mapServerTaxiStatus } from "../mappers/mapServerTaxiStatus.js";

function pickData(res) {
  return res?.data ?? res ?? null;
}

async function tryPost(url, body, fallbackLabel) {
  try {
    const res = await api.post(url, body);
    return pickData(res);
  } catch (error) {
    taxiLogger.warn(fallbackLabel, {
      url,
      error: error?.message || String(error),
    });
    throw error;
  }
}

function normalizeOrder(order) {
  if (!order || typeof order !== "object") return order;
  return {
    ...order,
    status: mapServerTaxiStatus(order.status || order.order_status),
  };
}

export const taxiClientApi = {
  async createOrder(payload) {
    return pickData(await api.post("/api/order", payload));
  },

  async getOrder(orderId) {
    const candidates = [
      () => tryPost("/api/order/get", { order_id: orderId }, "taxiClientApi.getOrder direct endpoint failed"),
      () => tryPost("/api/order", { action: "get", order_id: orderId }, "taxiClientApi.getOrder action fallback failed"),
    ];

    for (const run of candidates) {
      try {
        return normalizeOrder(await run());
      } catch {
        // try next candidate
      }
    }
    return null;
  },


  async getActiveOrder() {
    const payloads = [
      ["/api/order/active", {}],
      ["/api/order", { action: "active" }],
    ];
    for (const [url, body] of payloads) {
      try {
        return normalizeOrder(pickData(await api.post(url, body)));
      } catch {
        // try next candidate
      }
    }
    return null;
  },

  async cancelOrder(orderId) {
    const payloads = [
      ["/api/order/cancel", { order_id: orderId }],
      ["/api/order", { action: "cancel", order_id: orderId }],
    ];
    for (const [url, body] of payloads) {
      try {
        return pickData(await api.post(url, body));
      } catch {
        // try next candidate
      }
    }
    return null;
  },

  async listDriverAvailableOrders() {
    const payloads = [
      ["/api/order/list-available", {}],
      ["/api/order", { action: "list_available" }],
    ];
    for (const [url, body] of payloads) {
      try {
        const data = pickData(await api.post(url, body));
        const list = Array.isArray(data) ? data : data?.items || [];
        return list.map(normalizeOrder);
      } catch {
        // try next candidate
      }
    }
    return [];
  },

  async setDriverOnline(isOnline) {
    const payloads = [
      ["/api/driver/state", { is_online: isOnline }],
      ["/api/driver", { action: "state", isOnline }],
    ];
    for (const [url, body] of payloads) {
      try {
        return pickData(await api.post(url, body));
      } catch {
        // try next candidate
      }
    }
    return null;
  },

  async sendDriverLocation({ lat, lng, heading, accuracy }) {
    const payloads = [
      ["/api/driver/location", { lat, lng, heading, accuracy }],
      ["/api/driver", { action: "location", lat, lng, heading, accuracy }],
    ];
    for (const [url, body] of payloads) {
      try {
        return pickData(await api.post(url, body));
      } catch {
        // try next candidate
      }
    }
    return null;
  },

  async acceptDriverOrder(id) {
    const payloads = [
      ["/api/order/accept", { order_id: id }],
      ["/api/order", { action: "accept", id }],
    ];
    for (const [url, body] of payloads) {
      try {
        return normalizeOrder(pickData(await api.post(url, body)));
      } catch {
        // try next candidate
      }
    }
    return null;
  },

  async declineDriverOrder(id) {
    const payloads = [
      ["/api/order/decline", { order_id: id }],
      ["/api/order", { action: "decline", id }],
    ];
    for (const [url, body] of payloads) {
      try {
        return pickData(await api.post(url, body));
      } catch {
        // try next candidate
      }
    }
    return null;
  },

  async updateDriverOrderStatus(id, status) {
    const normalizedStatus = mapServerTaxiStatus(status);
    const payloads = [
      ["/api/order/status", { order_id: id, status: normalizedStatus }],
      ["/api/order", { action: "update_status", id, status: normalizedStatus }],
    ];
    for (const [url, body] of payloads) {
      try {
        return normalizeOrder(pickData(await api.post(url, body)));
      } catch {
        // try next candidate
      }
    }
    return null;
  },

  async completeDriverOrder(id) {
    const payloads = [
      ["/api/order/complete", { order_id: id }],
      ["/api/order", { action: "complete", id }],
    ];
    for (const [url, body] of payloads) {
      try {
        return normalizeOrder(pickData(await api.post(url, body)));
      } catch {
        // try next candidate
      }
    }
    return null;
  },
};

export default taxiClientApi;
