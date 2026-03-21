import jwt from "jsonwebtoken";
import { AuthRepository } from "./repository";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const repo = new AuthRepository();

export class AuthService {
  async sendOtp(phone: string) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await repo.saveOtp(phone, code);
    // TODO: SMS integration (Eskiz / PlayMobile)
    console.warn(`[OTP] ${phone} → ${code}`);
    return { ok: true };
  }

  async verifyOtp(phone: string, code: string) {
    const valid = await repo.verifyOtp(phone, code);
    if (!valid) throw new Error("Invalid or expired OTP");
    let user = await repo.findUserByPhone(phone);
    if (!user) user = await repo.createUser(phone);
    const accessToken  = jwt.sign({ sub: user.id, phone }, JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ sub: user.id, type: "refresh" }, JWT_SECRET, { expiresIn: "30d" });
    await repo.saveRefreshToken(user.id, refreshToken);
    return { accessToken, refreshToken, user };
  }

  async refreshToken(token: string) {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (payload.type !== "refresh") throw new Error("Not a refresh token");
    const valid = await repo.isRefreshTokenValid(payload.sub, token);
    if (!valid) throw new Error("Refresh token revoked");
    const accessToken = jwt.sign({ sub: payload.sub }, JWT_SECRET, { expiresIn: "15m" });
    return { accessToken };
  }

  async logout(userId: string) {
    await repo.revokeAllRefreshTokens(userId);
  }
}
