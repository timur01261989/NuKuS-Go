import { PubSub, withFilter } from "graphql-subscriptions";
import { createClient } from "redis";

const pubsub = new PubSub();

// Redis pub/sub bridge
let redisClient: any;
async function getRedis() {
  if (!redisClient) {
    const { createClient } = await import("redis");
    redisClient = createClient({ url: `redis://${process.env.REDIS_HOST || "localhost"}:6379` });
    redisClient.on("error", (e: any) => console.error("[GQL Sub Redis]", e));
    await redisClient.connect();
    // Subscribe to events from ws-gateway
    await redisClient.subscribe("order:status:changed", (msg: string) => {
      const data = JSON.parse(msg);
      pubsub.publish("ORDER_STATUS_CHANGED", { orderStatusChanged: data });
    });
    await redisClient.subscribe("driver:location:updated", (msg: string) => {
      const data = JSON.parse(msg);
      pubsub.publish("DRIVER_LOCATION_UPDATED", { driverLocationUpdated: data });
    });
    await redisClient.subscribe("chat:new:message", (msg: string) => {
      const data = JSON.parse(msg);
      pubsub.publish("NEW_CHAT_MESSAGE", { newChatMessage: data });
    });
  }
  return redisClient;
}
getRedis().catch(console.error);

export const subscriptionResolvers = {
  orderStatusChanged: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(["ORDER_STATUS_CHANGED"]),
      (payload, variables) => payload.orderStatusChanged.id === variables.order_id
    ),
  },
  driverLocationUpdated: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(["DRIVER_LOCATION_UPDATED"]),
      (payload, variables) => payload.driverLocationUpdated.driver_id === variables.driver_id
    ),
  },
  newChatMessage: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(["NEW_CHAT_MESSAGE"]),
      (payload, variables) => payload.newChatMessage.room_id === variables.order_id
    ),
  },
};
