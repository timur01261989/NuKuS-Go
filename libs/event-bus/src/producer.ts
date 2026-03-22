import { Kafka, Producer, Message } from "kafkajs";

const kafka = new Kafka({
  clientId: process.env.SERVICE_NAME || "unigo-service",
  brokers:  (process.env.KAFKA_BROKERS || "kafka:9092").split(","),
  retry: { initialRetryTime: 300, retries: 8 },
});

let producer: Producer;
let isConnected = false;

async function getProducer(): Promise<Producer> {
  if (!isConnected) {
    producer = kafka.producer({
      allowAutoTopicCreation: true,
      idempotent: true,
      maxInFlightRequests: 5,
    });
    await producer.connect();
    isConnected = true;
  }
  return producer;
}

export async function publishEvent(
  topic:    string,
  payload:  object,
  key?:     string
): Promise<void> {
  try {
    const p = await getProducer();
    await p.send({
      topic,
      messages: [{
        key:   key || null,
        value: JSON.stringify({
          ...payload,
          _meta: {
            service:   process.env.SERVICE_NAME || "unknown",
            ts:        new Date().toISOString(),
            version:   "1.0",
          },
        }),
        headers: {
          "content-type": "application/json",
          "source-service": process.env.SERVICE_NAME || "unknown",
        },
      }],
    });
  } catch (e: any) {
    // Never crash on publish failure
    console.error(`[kafka-producer] Failed to publish ${topic}:`, e.message);
  }
}

export async function publishBatch(messages: Array<{ topic: string; payload: object; key?: string }>): Promise<void> {
  try {
    const p = await getProducer();
    const byTopic = messages.reduce<Record<string, Message[]>>((acc, m) => {
      acc[m.topic] = acc[m.topic] || [];
      acc[m.topic].push({
        key:   m.key || null,
        value: JSON.stringify({ ...m.payload, _ts: new Date().toISOString() }),
      });
      return acc;
    }, {});

    await Promise.all(
      Object.entries(byTopic).map(([topic, msgs]) => p.send({ topic, messages: msgs }))
    );
  } catch (e: any) {
    console.error("[kafka-producer] Batch publish failed:", e.message);
  }
}

export async function disconnectProducer(): Promise<void> {
  if (isConnected && producer) {
    await producer.disconnect();
    isConnected = false;
  }
}

// ── Domain event helpers ──────────────────────────────────────────────────────
export const Events = {
  async rideCreated(order: any)        { await publishEvent("ride.created",     order,   order.id); },
  async rideMatched(orderId: string, driverId: string, etaMin: number) {
    await publishEvent("ride.matched",  { order_id: orderId, driver_id: driverId, eta_minutes: etaMin }, orderId);
  },
  async rideCompleted(order: any)      { await publishEvent("ride.completed",   order,   order.id); },
  async rideCancelled(orderId: string, reason: string) {
    await publishEvent("ride.cancelled",{ order_id: orderId, reason }, orderId);
  },
  async driverLocation(driverId: string, lat: number, lng: number, bearing = 0, speed = 0) {
    await publishEvent("driver.location",{ driver_id: driverId, lat, lng, bearing, speed }, driverId);
  },
  async driverStatus(driverId: string, status: string) {
    await publishEvent("driver.status", { driver_id: driverId, status }, driverId);
  },
  async paymentCompleted(orderId: string, userId: string, amount: number, provider: string) {
    await publishEvent("payment.completed",{ order_id: orderId, user_id: userId, amount_uzs: amount, provider }, orderId);
  },
  async userEvent(userId: string, event: string, data?: object) {
    await publishEvent("user.events", { user_id: userId, event, ...data }, userId);
  },
};
