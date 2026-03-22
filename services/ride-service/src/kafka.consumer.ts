import { Kafka, Consumer } from "kafkajs";

const kafka = new Kafka({
  clientId: "ride-service",
  brokers:  (process.env.KAFKA_BROKERS || "kafka:9092").split(","),
  retry: { initialRetryTime: 300, retries: 8 },
});

let consumer: Consumer;

export async function startConsumer(): Promise<void> {
  consumer = kafka.consumer({ groupId: "ride-service-group" });
  await consumer.connect();

  await consumer.subscribe({
    topics: ["payment.completed", "driver.status", "order.saga.rollback"],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const payload = JSON.parse(message.value?.toString() || "{}");

        if (topic === "payment.completed") {
          // Payment confirmed — mark order as paid
          const { order_id } = payload;
          if (order_id) {
            const { createClient } = await import("@supabase/supabase-js");
            const sb = createClient(
              process.env.SUPABASE_URL || "",
              process.env.SUPABASE_SERVICE_ROLE_KEY || ""
            );
            await sb.from("orders").update({
              status: "completed", payment_status: "paid",
              updated_at: new Date().toISOString(),
            }).eq("id", order_id);
            console.warn(`[ride-consumer] Order ${order_id} marked as paid`);
          }
        }

        if (topic === "driver.status") {
          const { driver_id, status } = payload;
          console.warn(`[ride-consumer] Driver ${driver_id} status: ${status}`);
        }

      } catch (e: any) {
        console.error(`[ride-consumer] Error processing ${topic}:`, e.message);
      }
    },
  });

  console.warn("[ride-service] Kafka consumer started");
}

export async function stopConsumer(): Promise<void> {
  if (consumer) await consumer.disconnect();
}
