import {
  appendDeliveryHistory,
  calcDeliveryCommission,
  createDeliveryOrder,
  deleteDeliveryOrder,
  getTripSettings,
  listDeliveryOrders,
  listOpenIntercityTrips,
  saveTripSettings,
  updateDeliveryOrder,
} from "@/modules/client/features/client/delivery/services/deliveryStore";

export const deliverySdk = {
  listOrders: listDeliveryOrders,
  createOrder: createDeliveryOrder,
  updateOrder: updateDeliveryOrder,
  deleteOrder: deleteDeliveryOrder,
  appendHistory: appendDeliveryHistory,
  listOpenTrips: listOpenIntercityTrips,
  getTripSettings,
  saveTripSettings,
  calcCommission: calcDeliveryCommission,
};

export {
  appendDeliveryHistory,
  calcDeliveryCommission,
  createDeliveryOrder,
  deleteDeliveryOrder,
  getTripSettings,
  listDeliveryOrders,
  listOpenIntercityTrips,
  saveTripSettings,
  updateDeliveryOrder,
};