import clientOrderService from "./clientOrderService.js";

export const subscribeOrder = clientOrderService.subscribeOrder;
export const subscribeOrders = clientOrderService.subscribeOrders;
export const getOrderById = clientOrderService.getOrderById;
export const listOrders = clientOrderService.listOrders;

export default {
  subscribeOrder,
  subscribeOrders,
  getOrderById,
  listOrders,
};
