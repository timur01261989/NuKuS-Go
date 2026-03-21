import { createClient, RedisClientType } from "redis";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";

let pubClient: RedisClientType;
let subClient: RedisClientType;

export async function createRedisAdapter(io: Server) {
  const redisUrl = `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || 6379}`;
  pubClient = createClient({ url: redisUrl }) as RedisClientType;
  subClient = pubClient.duplicate() as RedisClientType;

  pubClient.on("error", err => console.error("[Redis pub]", err));
  subClient.on("error", err => console.error("[Redis sub]", err));

  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient as any, subClient as any));
  console.warn("[ws-gateway] Redis adapter connected");
}

/** Publish event to a channel (used by backend services) */
export async function publish(channel: string, data: object) {
  if (!pubClient?.isOpen) return;
  await pubClient.publish(channel, JSON.stringify(data));
}

/** Subscribe to a Redis channel */
export async function subscribe(channel: string, handler: (data: any) => void) {
  if (!subClient?.isOpen) return;
  await subClient.subscribe(channel, (msg) => {
    try { handler(JSON.parse(msg)); } catch {}
  });
}
