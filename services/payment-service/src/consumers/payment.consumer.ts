import { Kafka, EachMessagePayload } from "kafkajs";

const kafka = new Kafka({
  clientId: "payment-service-consumer",
  brokers:  (process.env.KAFKA_BROKERS || "kafka:9092").split(","),
});

export async function startPaymentConsumer() {
  const consumer = kafka.consumer({ groupId: "payment-service-group" });
  await consumer.connect();

  await consumer.subscribe({ topics: [
    "ride.completed",
    "subscription.renewed",
  ], fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }: EachMessagePayload) => {
      const data = JSON.parse(message.value?.toString() || "{}");
      try {
        switch (topic) {
          case "ride.completed":
            // Trigger payment settlement
            await triggerSettlement(data);
            break;
          case "subscription.renewed":
            await processSubscriptionPayment(data);
            break;
        }
      } catch(e) {
        console.error(`[PaymentConsumer] Error:`, e);
      }
    },
  });
  console.warn("[payment-service] Kafka consumer started");
}

async function triggerSettlement(data: any) {
  // Auto-settle if wallet payment
  if (data.payment_method === "wallet") {
    await fetch(`${process.env.WALLET_SERVICE_URL || "http://wallet-service:3024"}/wallet/unlock`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: data.client_id, amount: data.price_uzs, order_id: data.order_id, charge: true }),
    }).catch(() => null);
  }
}

async function processSubscriptionPayment(data: any) {
  // Auto-renew subscription payment
  console.warn(`[Payment] Processing subscription renewal for user: ${data.user_id}`);
}
