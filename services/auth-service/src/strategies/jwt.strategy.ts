import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";

const JWT_SECRET  = process.env.JWT_SECRET || "change-me-in-production";
const JWT_ISSUER  = "unigo-platform";
const JWT_AUDIENCE = "unigo-users";

export interface JwtPayload {
  sub: string;       // user_id
  phone?: string;
  role?: "client" | "driver" | "admin";
  iat?: number;
  exp?: number;
}

export class JwtStrategy {
  signAccessToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
    const opts: SignOptions = {
      expiresIn: "15m",
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    };
    return jwt.sign(payload, JWT_SECRET, opts);
  }

  signRefreshToken(userId: string): string {
    return jwt.sign(
      { sub: userId, type: "refresh" },
      JWT_SECRET,
      { expiresIn: "30d", issuer: JWT_ISSUER }
    );
  }

  verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    } as VerifyOptions) as JwtPayload;
  }

  verifyRefreshToken(token: string): { sub: string; type: string } {
    return jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
    } as VerifyOptions) as { sub: string; type: string };
  }

  decodeWithoutVerify(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
}
