import { getProducer } from "./kafka.client";

export interface DomainEvent<T = any> {
  topic:    string;
  key?:     string;
  payload:  T;
  metadata?: {
    source:    string;
    timestamp: string;
    version:   string;
  };
}

export async function publish<T>(event: DomainEvent<T>): Promise<void> {
  try {
    const producer = await getProducer();
    await producer.send({
      topic: event.topic,
      messages: [{
        key:   event.key || null,
        value: JSON.stringify({
          ...event.payload,
          _meta: event.metadata || {
            source:    process.env.SERVICE_NAME || "unknown",
            timestamp: new Date().toISOString(),
            version:   "1.0",
          },
        }),
      }],
    });
  } catch (err) {
    console.error(`[event-bus] Failed to publish to ${event.topic}:`, err);
    // Never throw — publishing failure should not crash the service
  }
}

export async function publishBatch<T>(events: DomainEvent<T>[]): Promise<void> {
  try {
    const producer = await getProducer();
    const byTopic = events.reduce<Record<string, any[]>>((acc, e) => {
      acc[e.topic] = acc[e.topic] || [];
      acc[e.topic].push({ key: e.key || null, value: JSON.stringify(e.payload) });
      return acc;
    }, {});

    for (const [topic, messages] of Object.entries(byTopic)) {
      await producer.send({ topic, messages });
    }
  } catch (err) {
    console.error("[event-bus] Batch publish failed:", err);
  }
}
