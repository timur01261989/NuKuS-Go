import api from "@/utils/apiHelper";

/**
 * cityTaxiApi.js
 * Driver city-taxi moduli uchun yagona API layer.
 * Backend bo‘lmasa ham UI yiqilmasligi uchun: xatoda mock fallback.
 *
 * Kutiladigan backend action'lar:
 * - /api/order { action: 'list_available' }
 * - /api/order { action: 'accept', id }
 * - /api/order { action: 'decline', id }
 * - /api/order { action: 'update_status', id, status }
 * - /api/order { action: 'complete', id }
 * - /api/order { action: 'cancel', id }
 * - /api/driver { action: 'location', lat, lng, heading }
 */

function pickData(res) {
  return res?.data ?? res ?? null;
}

export const cityTaxiApi = {
  async listAvailable() {
    try {
      const res = await api.post("/api/order", { action: "list_available" });
      const data = pickData(res);
      return Array.isArray(data) ? data : (data?.items || []);
    } catch (e) {
      // fallback: empty
      return [];
    }
  },

  async accept(id) {
    const res = await api.post("/api/order", { action: "accept", id });
    return pickData(res);
  },

  async decline(id) {
    const res = await api.post("/api/order", { action: "decline", id });
    return pickData(res);
  },

  async updateStatus(id, status) {
    const res = await api.post("/api/order", { action: "update_status", id, status });
    return pickData(res);
  },

  async complete(id) {
    const res = await api.post("/api/order", { action: "complete", id });
    return pickData(res);
  },

  async cancel(id) {
    const res = await api.post("/api/order", { action: "cancel", id });
    return pickData(res);
  },

  async sendDriverLocation({ lat, lng, heading, accuracy }) {
    const res = await api.post("/api/driver", { action: "location", lat, lng, heading, accuracy });
    return pickData(res);
  },

  async setDriverOnline(isOnline) {
    const res = await api.post("/api/driver", { action: "state", isOnline });
    return pickData(res);
  },
};
