import { Server, Socket } from "socket.io";

export function setupDriversNamespace(io: Server) {
  const ns = io.of("/drivers");

  ns.on("connection", (socket: Socket) => {
    const driverId = socket.handshake.auth?.driver_id as string;
    if (!driverId) { socket.disconnect(); return; }

    // Join driver's own room
    socket.join(`driver:${driverId}`);
    console.warn(`[ws] driver connected: ${driverId}`);

    // Driver sends location update
    socket.on("location:update", (data: { lat: number; lng: number; bearing: number; speed: number }) => {
      // Broadcast to all clients watching this driver
      io.of("/rides").to(`watching:${driverId}`).emit("driver:location", { driver_id: driverId, ...data, ts: Date.now() });
    });

    // Driver status change
    socket.on("status:change", (status: "online" | "offline" | "on_trip") => {
      io.of("/drivers").emit("driver:status", { driver_id: driverId, status });
    });

    socket.on("disconnect", () => {
      io.of("/drivers").emit("driver:status", { driver_id: driverId, status: "offline" });
    });
  });
}
