import { Kafka, EachMessagePayload } from "kafkajs";

const kafka = new Kafka({
  clientId: "matching-service-consumer",
  brokers:  (process.env.KAFKA_BROKERS || "kafka:9092").split(","),
});

export async function startMatchingConsumer() {
  const consumer = kafka.consumer({ groupId: "matching-service-group" });
  await consumer.connect();

  await consumer.subscribe({ topics: [
    "ride.created",
    "ride.cancelled",
    "ride.expired",
  ], fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }: EachMessagePayload) => {
      const data = JSON.parse(message.value?.toString() || "{}");
      try {
        switch (topic) {
          case "ride.created":
            // Trigger dispatch
            await triggerDispatch(data);
            break;
          case "ride.cancelled":
          case "ride.expired":
            // Free up driver if assigned
            await releaseDriver(data);
            break;
        }
      } catch(e) {
        console.error(`[MatchingConsumer] Error:`, e);
      }
    },
  });
  console.warn("[matching-service] Kafka consumer started");
}

async function triggerDispatch(order: any) {
  // Call dispatch API to find nearest driver
  await fetch(`${process.env.DISPATCH_API_URL || "http://matching-service:3015"}/matching/find-driver`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pickup_lat: order.pickup_lat, pickup_lng: order.pickup_lng,
      service_type: order.service_type || "taxi",
    }),
  }).then(async res => {
    if (res.ok) {
      const driver = await res.json();
      if (driver?.driver_id) {
        // Notify driver via ws-gateway
        const pub = (await import("ioredis")).default;
        const redis = new pub({ host: process.env.REDIS_HOST || "localhost" });
        await redis.publish("notification:push:inapp", JSON.stringify({
          user_id: driver.driver_id,
          title:   "Yangi buyurtma!",
          body:    `ETA: ${driver.eta_minutes} daqiqa`,
          type:    "order",
          metadata: { order_id: order.id, ...driver },
        }));
        redis.disconnect();
      }
    }
  }).catch(e => console.error("[Dispatch] trigger failed:", e));
}

async function releaseDriver(order: any) {
  if (!order.driver_id) return;
  const IORedis = (await import("ioredis")).default;
  const redis   = new IORedis({ host: process.env.REDIS_HOST || "localhost" });
  const meta    = await redis.hget("drivers:geo:meta", order.driver_id);
  if (meta) {
    const parsed = JSON.parse(meta);
    parsed.status = "online";
    await redis.hset("drivers:geo:meta", order.driver_id, JSON.stringify(parsed));
  }
  redis.disconnect();
}
