import { Context } from "../context";

export const userResolvers = {
  Query: {
    me: async (_: any, __: any, { user, dataSources }: Context) => {
      if (!user) throw new Error("AUTH_REQUIRED");
      return dataSources.authAPI.getUser(user.sub);
    },
    wallet: async (_: any, __: any, { user, dataSources }: Context) => {
      if (!user) throw new Error("AUTH_REQUIRED");
      return dataSources.walletAPI.getWallet(user.sub);
    },
    subscription: async (_: any, __: any, { user, dataSources }: Context) => {
      if (!user) throw new Error("AUTH_REQUIRED");
      return dataSources.subscriptionAPI.getUserSubscription(user.sub);
    },
  },
  Mutation: {
    sendOtp: async (_: any, { phone }: any, { dataSources }: Context) => {
      await dataSources.authAPI.sendOtp(phone);
      return true;
    },
    verifyOtp: async (_: any, { phone, code }: any, { dataSources }: Context) => {
      return dataSources.authAPI.verifyOtp(phone, code);
    },
    refreshToken: async (_: any, { token }: any, { dataSources }: Context) => {
      return dataSources.authAPI.refreshToken(token);
    },
    logout: async (_: any, __: any, { user, dataSources }: Context) => {
      if (!user) return false;
      await dataSources.authAPI.logout(user.sub);
      return true;
    },
    topUpWallet: async (_: any, { amount, provider }: any, { user, dataSources }: Context) => {
      if (!user) throw new Error("AUTH_REQUIRED");
      return dataSources.walletAPI.topUp(user.sub, amount, provider);
    },
    subscribe: async (_: any, { plan_id, billing }: any, { user, dataSources }: Context) => {
      if (!user) throw new Error("AUTH_REQUIRED");
      return dataSources.subscriptionAPI.subscribe(user.sub, plan_id, billing);
    },
  },
  User: {
    wallet: async (user: any, _: any, { dataSources }: Context) => {
      return dataSources.walletAPI.getWallet(user.id);
    },
    activeOrder: async (user: any, _: any, { dataSources }: Context) => {
      return dataSources.rideAPI.getActiveOrder(user.id);
    },
    orders: async (user: any, { limit = 10, offset = 0 }: any, { dataSources }: Context) => {
      return dataSources.rideAPI.getUserOrders(user.id, limit, offset);
    },
  },
};
