import { Kafka, Consumer, EachMessagePayload } from "kafkajs";

const kafka = new Kafka({
  clientId: "ride-service-consumer",
  brokers:  (process.env.KAFKA_BROKERS || "kafka:9092").split(","),
});

let consumer: Consumer;

export async function startRideConsumer() {
  consumer = kafka.consumer({ groupId: "ride-service-group" });
  await consumer.connect();

  await consumer.subscribe({ topics: [
    "payment.completed",
    "payment.failed",
    "driver.accepted",
    "safety.sos",
  ], fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }: EachMessagePayload) => {
      const data = JSON.parse(message.value?.toString() || "{}");
      try {
        switch (topic) {
          case "payment.completed":
            await handlePaymentCompleted(data);
            break;
          case "payment.failed":
            await handlePaymentFailed(data);
            break;
          case "driver.accepted":
            await handleDriverAccepted(data);
            break;
          case "safety.sos":
            await handleSosAlert(data);
            break;
        }
      } catch(e) {
        console.error(`[RideConsumer] Error processing ${topic}:`, e);
      }
    },
  });
  console.warn("[ride-service] Kafka consumer started");
}

async function handlePaymentCompleted(data: any) {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  await sb.from("orders").update({ status: "payment_completed", payment_confirmed: true })
    .eq("id", data.order_id);
}

async function handlePaymentFailed(data: any) {
  // Notify driver and client of payment failure
  await fetch(`${process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3006"}/notify/in-app`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: data.client_id, title: "To'lov xatosi", body: "To'lovni qayta urinib ko'ring", type: "payment" }),
  }).catch(() => null);
}

async function handleDriverAccepted(data: any) {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  await sb.from("orders").update({ driver_id: data.driver_id, status: "accepted" })
    .eq("id", data.order_id);
}

async function handleSosAlert(data: any) {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  await sb.from("orders").update({ sos_active: true }).eq("id", data.order_id);
}

export async function stopRideConsumer() {
  await consumer?.disconnect();
}
