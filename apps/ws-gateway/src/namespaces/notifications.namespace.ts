import { Server, Socket } from "socket.io";

export function setupNotificationsNamespace(io: Server) {
  const ns = io.of("/notifications");

  ns.on("connection", (socket: Socket) => {
    const userId = socket.handshake.auth?.user_id as string;
    if (!userId) { socket.disconnect(); return; }
    socket.join(`notify:${userId}`);
  });

  // Export helper to push notification from other services
  (global as any).pushNotification = (userId: string, payload: any) => {
    ns.to(`notify:${userId}`).emit("notification", { ...payload, ts: new Date().toISOString() });
  };
}
