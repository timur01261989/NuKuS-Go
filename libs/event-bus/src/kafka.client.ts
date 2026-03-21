import { Kafka, Producer, Consumer, KafkaConfig } from "kafkajs";

const config: KafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || "unigo-service",
  brokers:  (process.env.KAFKA_BROKERS || "kafka:9092").split(","),
  retry: { initialRetryTime: 300, retries: 8 },
};

const kafka = new Kafka(config);

let producer: Producer | null = null;

export async function getProducer(): Promise<Producer> {
  if (!producer) {
    producer = kafka.producer({ allowAutoTopicCreation: true });
    await producer.connect();
  }
  return producer;
}

export async function createConsumer(groupId: string): Promise<Consumer> {
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  return consumer;
}

export async function disconnect() {
  if (producer) { await producer.disconnect(); producer = null; }
}
