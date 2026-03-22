import { Kafka } from "kafkajs";
import { sendPush } from "./push.worker";
import { sendSms }  from "./sms.worker";
import { sendInApp } from "./inApp.worker";

const kafka = new Kafka({
  clientId: "notification-service",
  brokers:  (process.env.KAFKA_BROKERS || "kafka:9092").split(","),
});

export async function startConsumer(): Promise<void> {
  const consumer = kafka.consumer({ groupId: "notification-service-group" });
  await consumer.connect();

  await consumer.subscribe({
    topics: [
      "ride.created",
      "ride.matched",
      "ride.completed",
      "payment.completed",
      "notification.push",
      "notification.sms",
    ],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const payload = JSON.parse(message.value?.toString() || "{}");

        if (topic === "ride.created") {
          // Notify nearby drivers
          console.warn(`[notif-consumer] New ride: ${payload.order_id}`);
        }

        if (topic === "ride.matched") {
          // Notify client driver found
          if (payload.client_id) {
            await sendInApp({
              user_id: payload.client_id,
              title:   "Haydovchi topildi! 🚗",
              body:    `${payload.eta_minutes || 3} daqiqada yetib keladi`,
              type:    "order",
              metadata: { order_id: payload.order_id },
            }).catch(() => null);
          }
        }

        if (topic === "ride.completed") {
          // Send rating reminder
          if (payload.client_id) {
            await sendInApp({
              user_id: payload.client_id,
              title:   "Safaringiz yakunlandi",
              body:    "Haydovchini baholang — bu uning daromadiga ta'sir qiladi",
              type:    "order",
              metadata: { order_id: payload.order_id, action: "rate" },
            }).catch(() => null);
          }
        }

        if (topic === "payment.completed") {
          if (payload.user_id) {
            await sendInApp({
              user_id: payload.user_id,
              title:   "To'lov qabul qilindi ✅",
              body:    `${(payload.amount_uzs || 0).toLocaleString("ru-RU")} so'm`,
              type:    "payment",
            }).catch(() => null);
          }
        }

        if (topic === "notification.push") {
          await sendPush(payload.token, payload.title, payload.body, payload.data).catch(() => null);
        }

        if (topic === "notification.sms") {
          await sendSms(payload.phone, payload.message).catch(() => null);
        }

      } catch (e: any) {
        console.error(`[notif-consumer] Error:`, e.message);
      }
    },
  });

  console.warn("[notification-service] Kafka consumer started");
}
