import { Context } from "../context";

export const driverResolvers = {
  Query: {
    nearbyDrivers: async (_: any, { lat, lng, radius_km = 5, service_type = "taxi" }: any, { dataSources }: Context) => {
      return dataSources.locationAPI.getNearbyDrivers(lat, lng, radius_km, service_type);
    },
    driver: async (_: any, { id }: any, { dataSources }: Context) => {
      return dataSources.locationAPI.getDriver(id);
    },
  },
  Mutation: {
    updateDriverLocation: async (_: any, { lat, lng, bearing, speed }: any, { user, dataSources }: Context) => {
      if (!user) throw new Error("AUTH_REQUIRED");
      await dataSources.locationAPI.updateLocation(user.sub, lat, lng, bearing, speed);
      return true;
    },
    setDriverStatus: async (_: any, { status }: any, { user, dataSources }: Context) => {
      if (!user) throw new Error("AUTH_REQUIRED");
      return dataSources.locationAPI.setDriverStatus(user.sub, status);
    },
    acceptOrder: async (_: any, { order_id }: any, { user, dataSources }: Context) => {
      if (!user) throw new Error("AUTH_REQUIRED");
      return dataSources.rideAPI.acceptOrder(order_id, user.sub);
    },
    completeOrder: async (_: any, { order_id }: any, { user, dataSources }: Context) => {
      if (!user) throw new Error("AUTH_REQUIRED");
      return dataSources.rideAPI.completeOrder(order_id, user.sub);
    },
  },
  Driver: {
    location: async (driver: any, _: any, { dataSources }: Context) => {
      return dataSources.locationAPI.getDriverLocation(driver.id || driver.user_id);
    },
    earnings: async (driver: any, _: any, { dataSources }: Context) => {
      return dataSources.earningsAPI.getSummary(driver.user_id || driver.id);
    },
  },
};
