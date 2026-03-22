import { Kafka } from "kafkajs";
import { eventCollector } from "./collectors/eventCollector";

const kafka = new Kafka({
  clientId: "analytics-service",
  brokers:  (process.env.KAFKA_BROKERS || "kafka:9092").split(","),
});

export async function startAnalyticsConsumer(): Promise<void> {
  const consumer = kafka.consumer({ groupId: "analytics-service-group" });
  await consumer.connect();

  await consumer.subscribe({
    topics: [
      "ride.created",
      "ride.completed",
      "ride.cancelled",
      "driver.location",
      "payment.completed",
      "user.events",
      "analytics.stream",
    ],
    fromBeginning: false,
  });

  await consumer.run({
    eachBatch: async ({ batch }) => {
      for (const message of batch.messages) {
        try {
          const payload = JSON.parse(message.value?.toString() || "{}");
          const topic   = batch.topic;

          if (topic === "ride.created" || topic === "ride.completed" || topic === "ride.cancelled") {
            eventCollector.trackOrder({
              order_id:   payload.order_id || payload.id,
              user_id:    payload.client_id || payload.user_id || "",
              driver_id:  payload.driver_id,
              service:    payload.service_type || "taxi",
              event_type: topic.split(".")[1],
              status:     payload.status || topic.split(".")[1],
              price_uzs:  payload.price_uzs || 0,
              city:       payload.city || "Toshkent",
            });
          }

          if (topic === "driver.location") {
            eventCollector.trackLocation({
              driver_id: payload.driver_id,
              lat:       payload.lat,
              lng:       payload.lng,
              bearing:   payload.bearing || 0,
              speed:     payload.speed || 0,
            });
          }

          if (topic === "payment.completed") {
            eventCollector.trackPayment({
              order_id:   payload.order_id,
              user_id:    payload.user_id,
              provider:   payload.provider || "wallet",
              amount_uzs: payload.amount_uzs || 0,
              status:     "completed",
            });
          }
        } catch (e: any) {
          console.error("[analytics-consumer] error:", e.message);
        }
      }
    },
  });

  console.warn("[analytics-service] Kafka consumer started (batch mode)");
}
