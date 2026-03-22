import { Kafka, EachMessagePayload } from "kafkajs";
import { eventCollector } from "../collectors/eventCollector";

const kafka = new Kafka({
  clientId: "analytics-service-consumer",
  brokers:  (process.env.KAFKA_BROKERS || "kafka:9092").split(","),
});

export async function startAnalyticsConsumer() {
  const consumer = kafka.consumer({ groupId: "analytics-service-group" });
  await consumer.connect();

  await consumer.subscribe({ topics: [
    "ride.created",
    "ride.completed",
    "ride.cancelled",
    "payment.completed",
    "driver.location",
  ], fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }: EachMessagePayload) => {
      const data = JSON.parse(message.value?.toString() || "{}");
      try {
        switch (topic) {
          case "ride.created":
          case "ride.completed":
          case "ride.cancelled":
            eventCollector.trackOrder({
              order_id:   data.id || data.order_id,
              user_id:    data.client_id || data.user_id || "",
              driver_id:  data.driver_id,
              service:    data.service_type || "taxi",
              event_type: topic.replace("ride.", ""),
              status:     data.status || topic.replace("ride.", ""),
              price_uzs:  data.price_uzs || 0,
              lat:        data.pickup_lat,
              lng:        data.pickup_lng,
              city:       "Toshkent",
            });
            break;
          case "payment.completed":
            eventCollector.trackPayment({
              order_id:   data.order_id,
              user_id:    data.user_id,
              provider:   data.provider || "cash",
              amount_uzs: data.amount || 0,
              status:     "completed",
            });
            break;
          case "driver.location":
            eventCollector.trackLocation({
              driver_id: data.driver_id,
              lat:       data.lat,
              lng:       data.lng,
              bearing:   data.bearing || 0,
              speed:     data.speed || 0,
            });
            break;
        }
      } catch(e) {
        console.error(`[AnalyticsConsumer] Error:`, e);
      }
    },
  });
  console.warn("[analytics-service] Kafka consumer started");
}
