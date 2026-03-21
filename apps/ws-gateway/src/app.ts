import { createServer } from "http";
import { Server } from "socket.io";
import { createRedisAdapter, subscribe } from "./adapters/redis-pubsub.adapter";
import { wsAuthGuard }                   from "./guards/ws-auth.guard";
import { setupDriversNamespace }         from "./namespaces/drivers.namespace";
import { setupRidesNamespace }           from "./namespaces/rides.namespace";
import { setupNotificationsNamespace }   from "./namespaces/notifications.namespace";
import { setupChatNamespace }            from "./namespaces/chat.namespace";

export async function createApp() {
  const httpServer = createServer();

  const io = new Server(httpServer, {
    cors:       { origin: process.env.CLIENT_ORIGIN || "*", methods: ["GET", "POST"] },
    transports: ["websocket", "polling"],
    pingTimeout:  20000,
    pingInterval: 25000,
    connectTimeout: 10000,
  });

  // Redis pub/sub horizontal scaling adapter
  await createRedisAdapter(io);

  // Auth guard on all namespaces
  io.use(wsAuthGuard);

  // Setup namespaces
  setupDriversNamespace(io);
  setupRidesNamespace(io);
  setupNotificationsNamespace(io);
  setupChatNamespace(io);

  // Subscribe to Kafka-relayed Redis events from services
  await subscribe("order:status:changed", (data) => {
    io.of("/rides").to(`order:${data.order_id}`).emit("order:status", data);
  });

  await subscribe("driver:location:updated", (data) => {
    io.of("/rides").to(`watching:${data.driver_id}`).emit("driver:location", data);
  });

  await subscribe("notification:push:inapp", (data) => {
    io.of("/notifications").to(`notify:${data.user_id}`).emit("notification", data);
  });

  return { httpServer, io };
}
