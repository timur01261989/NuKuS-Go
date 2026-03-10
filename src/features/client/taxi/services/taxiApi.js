import api from "@/utils/apiHelper";

/** Thin wrapper around apiHelper for taxi */
export const taxiApi = {
  createOrder: (payload) => api.post("/api/order", payload),
  cancelOrder: (payload) => api.post("/api/order", payload),
  status: (payload) => api.post("/api/order", payload),
  dispatch: (payload) => api.post("/api/dispatch", payload),
};

export default taxiApi;
