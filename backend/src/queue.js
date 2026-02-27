import { Queue } from "bullmq";
import IORedis from "ioredis";

export const redis = new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

export const aiQueue = new Queue("ai-jobs", {
  connection: redis
});
