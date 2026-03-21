import { Server, Socket } from "socket.io";

export function setupRidesNamespace(io: Server) {
  const ns = io.of("/rides");

  ns.on("connection", (socket: Socket) => {
    const userId = socket.handshake.auth?.user_id as string;
    if (!userId) { socket.disconnect(); return; }

    socket.join(`user:${userId}`);

    // Client starts watching a driver
    socket.on("watch:driver", (driverId: string) => {
      socket.join(`watching:${driverId}`);
    });

    // Client stops watching
    socket.on("unwatch:driver", (driverId: string) => {
      socket.leave(`watching:${driverId}`);
    });

    // Order status updates (pushed from ride-service via Redis pub/sub)
    socket.on("order:subscribe", (orderId: string) => {
      socket.join(`order:${orderId}`);
    });

    socket.on("disconnect", () => {
      console.warn(`[ws] client disconnected: ${userId}`);
    });
  });
}
