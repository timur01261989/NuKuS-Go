import api from "@/modules/shared/utils/apiHelper";

/** Thin wrapper around apiHelper for taxi */
export const taxiApi = {
  createOrder: (payload) => api.post("/api/order", payload),
  cancelOrder: (payload) => api.post("/api/order", payload),
  status: (payload) => api.post("/api/order", payload),
  dispatch: (payload) => api.post("/api/dispatch", payload),
  acceptOffer: (payload) => api.post("/api/offer", { action: "accept", ...payload }),
  rejectOffer: (payload) => api.post("/api/offer", { action: "reject", ...payload }),
  expireOffers: (payload = {}) => api.post("/api/offer", { action: "timeout", ...payload }),
  driverHeartbeat: (payload) => api.post("/api/driver_heartbeat", payload),
};

export default taxiApi;
