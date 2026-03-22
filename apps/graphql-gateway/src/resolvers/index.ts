import { userResolvers }     from "./user.resolvers";
import { orderResolvers }    from "./order.resolvers";
import { driverResolvers }   from "./driver.resolvers";
import { marketResolvers }   from "./market.resolvers";
import { subscriptionResolvers } from "./subscription.resolvers";

export const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...orderResolvers.Query,
    ...driverResolvers.Query,
    ...marketResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...orderResolvers.Mutation,
    ...driverResolvers.Mutation,
    ...marketResolvers.Mutation,
  },
  Subscription: {
    ...subscriptionResolvers,
  },
  User: userResolvers.User,
  Order: orderResolvers.Order,
  Driver: driverResolvers.Driver,
};
