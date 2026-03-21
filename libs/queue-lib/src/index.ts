import { Queue, Worker, Job, QueueOptions, WorkerOptions } from "bullmq";
import IORedis from "ioredis";

const redisConn = new IORedis({
  host:     process.env.REDIS_HOST || "localhost",
  port:     Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

export const QUEUES = {
  DISPATCH:    "dispatch",
  NOTIFICATION:"notification",
  PAYMENT:     "payment",
  ANALYTICS:   "analytics",
  EMAIL:       "email",
  SMS:         "sms",
  REPOSITION:  "driver-reposition",
} as const;

export type QueueName = typeof QUEUES[keyof typeof QUEUES];

const queues = new Map<string, Queue>();

export function getQueue(name: QueueName): Queue {
  if (!queues.has(name)) {
    queues.set(name, new Queue(name, {
      connection: redisConn,
      defaultJobOptions: {
        removeOnComplete: { age: 3600, count: 1000 },
        removeOnFail:    { age: 86400, count: 5000 },
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
      },
    }));
  }
  return queues.get(name)!;
}

export async function addJob<T>(queue: QueueName, name: string, data: T, opts?: object): Promise<Job> {
  const q = getQueue(queue);
  return q.add(name, data, opts);
}

export function createWorker<T = any>(
  queue:    QueueName,
  handler:  (job: Job<T>) => Promise<any>,
  opts?:    Partial<WorkerOptions>
): Worker {
  return new Worker(queue, handler, {
    connection: redisConn,
    concurrency: 10,
    ...opts,
  });
}

// Dispatch queue helpers
export async function enqueueDispatch(orderId: string, serviceType: string, radiusMeters = 2500) {
  return addJob(QUEUES.DISPATCH, "find-driver", { orderId, serviceType, radiusMeters });
}

export async function enqueueNotification(userId: string, title: string, body: string, data?: object) {
  return addJob(QUEUES.NOTIFICATION, "send-push", { userId, title, body, data });
}

export async function enqueueSms(phone: string, message: string) {
  return addJob(QUEUES.SMS, "send-sms", { phone, message });
}

export async function enqueuePayment(orderId: string, amount: number, method: string) {
  return addJob(QUEUES.PAYMENT, "process-payment", { orderId, amount, method });
}

export async function enqueueAnalytics(event: string, data: object) {
  return addJob(QUEUES.ANALYTICS, event, data, {
    removeOnComplete: true,
    attempts: 1,
  });
}
