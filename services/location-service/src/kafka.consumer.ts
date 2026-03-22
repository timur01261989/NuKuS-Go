import { Kafka } from "kafkajs";
import { SpatialService } from "./spatial";
import { RedisGeo } from "./redis";

const kafka = new Kafka({
  clientId: "location-service",
  brokers:  (process.env.KAFKA_BROKERS || "kafka:9092").split(","),
});

const geo     = new RedisGeo();
const spatial = new SpatialService(geo);

export async function startLocationConsumer(): Promise<void> {
  const consumer = kafka.consumer({ groupId: "location-service-group" });
  await consumer.connect();

  await consumer.subscribe({
    topics: ["driver.location", "driver.status"],
    fromBeginning: false,
  });

  await consumer.run({
    eachBatch: async ({ batch }) => {
      // Process locations in batch for efficiency
      const updates = batch.messages.map(m => {
        try { return JSON.parse(m.value?.toString() || "{}"); } catch { return null; }
      }).filter(Boolean);

      await Promise.all(updates.map(async (data: any) => {
        if (data.driver_id && data.lat !== undefined) {
          await spatial.updateDriverLocation(
            data.driver_id, data.lat, data.lng,
            data.bearing || 0, data.speed || 0
          ).catch(() => null);
        }
      }));
    },
  });

  console.warn("[location-service] Kafka consumer started (batch mode)");
}
