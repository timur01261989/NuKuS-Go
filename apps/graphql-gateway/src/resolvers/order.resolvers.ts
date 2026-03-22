import { Context } from "../context";

export const orderResolvers = {
  Query: {
    order: async (_: any, { id }: any, { dataSources }: Context) => {
      return dataSources.rideAPI.getOrder(id);
    },
    myOrders: async (_: any, { limit = 10, offset = 0 }: any, { user, dataSources }: Context) => {
      if (!user) throw new Error("AUTH_REQUIRED");
      return dataSources.rideAPI.getUserOrders(user.sub, limit, offset);
    },
    activeOrder: async (_: any, __: any, { user, dataSources }: Context) => {
      if (!user) throw new Error("AUTH_REQUIRED");
      return dataSources.rideAPI.getActiveOrder(user.sub);
    },
    eta: async (_: any, args: any, { dataSources }: Context) => {
      return dataSources.mlAPI.getETA(args);
    },
    surge: async (_: any, { lat, lng }: any, { dataSources }: Context) => {
      return dataSources.mlAPI.getSurge(lat, lng);
    },
    chatMessages: async (_: any, { order_id, limit = 50 }: any, { user, dataSources }: Context) => {
      if (!user) throw new Error("AUTH_REQUIRED");
      return dataSources.chatAPI.getMessages(order_id, limit);
    },
  },
  Mutation: {
    createOrder: async (_: any, { input }: any, { user, dataSources }: Context) => {
      if (!user) throw new Error("AUTH_REQUIRED");
      return dataSources.rideAPI.createOrder({ ...input, client_id: user.sub });
    },
    cancelOrder: async (_: any, { id, reason }: any, { user, dataSources }: Context) => {
      if (!user) throw new Error("AUTH_REQUIRED");
      return dataSources.rideAPI.cancelOrder(id, reason);
    },
    rateDriver: async (_: any, { order_id, rating, comment }: any, { user, dataSources }: Context) => {
      if (!user) throw new Error("AUTH_REQUIRED");
      await dataSources.rideAPI.rateDriver(order_id, user.sub, rating, comment);
      return true;
    },
    sendChatMessage: async (_: any, { order_id, content, type = "text" }: any, { user, dataSources }: Context) => {
      if (!user) throw new Error("AUTH_REQUIRED");
      return dataSources.chatAPI.sendMessage(order_id, user.sub, "client", content, type);
    },
    markChatRead: async (_: any, { order_id }: any, { user, dataSources }: Context) => {
      if (!user) throw new Error("AUTH_REQUIRED");
      await dataSources.chatAPI.markRead(order_id, "client");
      return true;
    },
  },
  Order: {
    driver: async (order: any, _: any, { dataSources }: Context) => {
      if (!order.driver_id) return null;
      return dataSources.locationAPI.getDriver(order.driver_id);
    },
  },
};
