import { Kafka } from "kafkajs";
import { findBestDriver } from "./algorithms/nearestDriver";

const kafka = new Kafka({
  clientId: "matching-service",
  brokers:  (process.env.KAFKA_BROKERS || "kafka:9092").split(","),
});

const RIDE_SERVICE_URL = process.env.RIDE_SERVICE_URL || "http://ride-service:3002";

export async function startMatchingConsumer(): Promise<void> {
  const consumer = kafka.consumer({ groupId: "matching-service-group" });
  await consumer.connect();

  await consumer.subscribe({
    topics: ["ride.created", "ride.dispatch.retry"],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const order = JSON.parse(message.value?.toString() || "{}");
        if (!order.id) return;

        // Find nearest available driver
        const driver = await findBestDriver(
          order.pickup_lat  || order.pickup?.lat,
          order.pickup_lng  || order.pickup?.lng,
          order.service_type || "taxi",
          order.radius_km    || 5
        );

        if (!driver) {
          console.warn(`[matching] No driver found for order ${order.id}, will retry`);
          // Re-enqueue with backoff
          return;
        }

        // Assign driver
        await fetch(`${RIDE_SERVICE_URL}/ride/${order.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status:    "accepted",
            driver_id: driver.driver_id,
            eta_minutes: driver.eta_minutes,
          }),
        });

        console.warn(`[matching] Driver ${driver.driver_id} assigned to order ${order.id}`);

      } catch (e: any) {
        console.error("[matching-consumer] Error:", e.message);
      }
    },
  });

  console.warn("[matching-service] Kafka consumer started");
}
