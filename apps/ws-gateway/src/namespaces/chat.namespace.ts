import { Server, Socket } from "socket.io";

export function setupChatNamespace(io: Server) {
  const ns = io.of("/chat");

  ns.on("connection", (socket: Socket) => {
    const userId = socket.handshake.auth?.user_id as string;
    if (!userId) { socket.disconnect(); return; }

    socket.on("chat:join", (orderId: string) => {
      socket.join(`chat:${orderId}`);
    });

    socket.on("chat:message", (data: { order_id: string; text: string; sender_id: string }) => {
      ns.to(`chat:${data.order_id}`).emit("chat:message", {
        ...data,
        id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        ts: new Date().toISOString(),
      });
    });

    socket.on("chat:typing", (data: { order_id: string }) => {
      socket.to(`chat:${data.order_id}`).emit("chat:typing", { sender_id: userId });
    });
  });
}
