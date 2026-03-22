import { Kafka, EachMessagePayload } from "kafkajs";

const kafka = new Kafka({
  clientId: "location-service-consumer",
  brokers:  (process.env.KAFKA_BROKERS || "kafka:9092").split(","),
});

export async function startLocationConsumer() {
  const consumer = kafka.consumer({ groupId: "location-service-group" });
  await consumer.connect();

  await consumer.subscribe({ topics: [
    "ride.created",
    "ride.completed",
    "ride.cancelled",
    "driver.status.changed",
  ], fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }: EachMessagePayload) => {
      const data = JSON.parse(message.value?.toString() || "{}");
      try {
        switch (topic) {
          case "ride.created":
            // Start tracking driver for this ride
            console.warn(`[Location] Tracking started for order: ${data.order_id}`);
            break;
          case "ride.completed":
          case "ride.cancelled":
            // Stop intensive tracking
            console.warn(`[Location] Tracking stopped for order: ${data.order_id}`);
            break;
          case "driver.status.changed":
            await handleDriverStatusChange(data);
            break;
        }
      } catch(e) {
        console.error(`[LocationConsumer] Error:`, e);
      }
    },
  });
  console.warn("[location-service] Kafka consumer started");
}

async function handleDriverStatusChange(data: any) {
  // When driver goes offline, remove from geo index
  if (data.status === "offline") {
    const IORedis = (await import("ioredis")).default;
    const redis = new IORedis({ host: process.env.REDIS_HOST || "localhost" });
    await redis.zrem("drivers:geo:taxi",        data.driver_id).catch(() => null);
    await redis.zrem("drivers:geo:delivery",    data.driver_id).catch(() => null);
    await redis.zrem("drivers:geo:freight",     data.driver_id).catch(() => null);
    await redis.zrem("drivers:geo:intercity",   data.driver_id).catch(() => null);
    await redis.zrem("drivers:geo:interdistrict",data.driver_id).catch(() => null);
    redis.disconnect();
  }
}
