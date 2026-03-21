import taxiClientApi from "@/modules/shared/taxi/api/taxiClientApi.js";

/**
 * cityTaxiApi.js
 * Driver city-taxi moduli uchun yagona API layer.
 * Canonical endpointlarni sinab ko‘radi, kerak bo‘lsa action-fallbackga tushadi.
 */
export const cityTaxiApi = {
  listAvailable() {
    return taxiClientApi.listDriverAvailableOrders();
  },

  accept(id) {
    return taxiClientApi.acceptDriverOrder(id);
  },

  decline(id) {
    return taxiClientApi.declineDriverOrder(id);
  },

  updateStatus(id, status) {
    return taxiClientApi.updateDriverOrderStatus(id, status);
  },

  complete(id) {
    return taxiClientApi.completeDriverOrder(id);
  },

  cancel(id) {
    return taxiClientApi.cancelOrder(id);
  },

  sendDriverLocation(payload) {
    return taxiClientApi.sendDriverLocation(payload);
  },

  setDriverOnline(isOnline) {
    return taxiClientApi.setDriverOnline(isOnline);
  },
};

export default cityTaxiApi;
