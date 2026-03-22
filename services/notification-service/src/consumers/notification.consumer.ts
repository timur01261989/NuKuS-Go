import { Kafka, EachMessagePayload } from "kafkajs";
import { sendPush } from "../push.worker";
import { sendSms }  from "../sms.worker";

const kafka = new Kafka({
  clientId: "notification-service-consumer",
  brokers:  (process.env.KAFKA_BROKERS || "kafka:9092").split(","),
});

export async function startNotificationConsumer() {
  const consumer = kafka.consumer({ groupId: "notification-service-group" });
  await consumer.connect();

  await consumer.subscribe({ topics: [
    "ride.created",
    "ride.matched",
    "ride.completed",
    "ride.cancelled",
    "payment.completed",
    "payment.failed",
    "driver.approaching",
    "safety.sos",
    "promo.new",
  ], fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }: EachMessagePayload) => {
      const data = JSON.parse(message.value?.toString() || "{}");
      try {
        await routeNotification(topic, data);
      } catch(e) {
        console.error(`[NotificationConsumer] Error for ${topic}:`, e);
      }
    },
  });
  console.warn("[notification-service] Kafka consumer started");
}

async function routeNotification(topic: string, data: any) {
  const MSGS: Record<string, { title: string; body: (d: any) => string; to: string }> = {
    "ride.created":      { title: "Buyurtma yaratildi",      body: () => "Haydovchi qidirilmoqda...",                            to: "client" },
    "ride.matched":      { title: "Haydovchi topildi! 🚗",   body: d => `ETA: ${d.eta_min || "~5"} daqiqa`,                     to: "client" },
    "ride.completed":    { title: "Sayohat yakunlandi ✅",    body: d => `Narx: ${(d.price_uzs||0).toLocaleString("ru")} so'm`, to: "client" },
    "ride.cancelled":    { title: "Buyurtma bekor qilindi",   body: d => d.reason || "Haydovchi topmadi",                        to: "client" },
    "payment.completed": { title: "To'lov muvaffaqiyatli ✅",body: d => `${(d.amount||0).toLocaleString("ru")} so'm to'landi`,to: "client" },
    "payment.failed":    { title: "To'lov xatosi ⚠️",        body: () => "Iltimos qayta urinib ko'ring",                       to: "client" },
    "driver.approaching":{ title: "Haydovchi yetib keldi 📍", body: () => "Haydovchi siz qaerda turibsiz?",                      to: "client" },
    "safety.sos":        { title: "🆘 SOS Signal!",           body: d => `Joylashuv: ${d.lat},${d.lng}`,                         to: "support" },
    "promo.new":         { title: "🎁 Yangi promo!",          body: d => d.description || "Yangi chegirma sizni kutmoqda",        to: "client" },
  };

  const msg = MSGS[topic];
  if (!msg) return;

  const userId = data.client_id || data.user_id;
  if (!userId) return;

  // Get user FCM token from DB
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: profile } = await sb.from("profiles").select("push_token").eq("id", userId).single();
  const token = (profile as any)?.push_token;

  if (token) {
    await sendPush(token, msg.title, msg.body(data), { topic, order_id: data.order_id });
  }
}
