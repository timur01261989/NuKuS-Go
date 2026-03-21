import { Socket } from "socket.io";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export interface AuthPayload { sub: string; phone: string; role: string; }

export function wsAuthGuard(socket: Socket, next: (err?: Error) => void) {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) return next(new Error("AUTH_MISSING"));

    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    (socket as any).user = payload;
    next();
  } catch (e: any) {
    next(new Error(`AUTH_INVALID: ${e?.message}`));
  }
}

export function getUserFromSocket(socket: Socket): AuthPayload | null {
  return (socket as any).user || null;
}
