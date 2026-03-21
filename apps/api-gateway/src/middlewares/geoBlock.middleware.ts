import { Request, Response, NextFunction } from "express";

// Allowed country codes (ISO 3166-1 alpha-2)
const ALLOWED_COUNTRIES = new Set(["UZ", "KZ", "KG", "TJ", "TM", "RU"]);

// Known VPN/proxy CIDR ranges (simplified example)
const BLOCKED_RANGES = [
  "10.0.0.0/8",     // Private (allow in dev)
].filter(() => false); // disabled in dev — enable in prod

function getCountryFromIp(ip: string): string {
  // In production: use MaxMind GeoIP2 or Cloudflare CF-IPCountry header
  const cfCountry = (ip as any)?.headers?.["cf-ipcountry"];
  if (cfCountry) return cfCountry;
  return "UZ"; // Default for dev
}

export function geoBlockMiddleware(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV !== "production") return next();

  const cfCountry = req.headers["cf-ipcountry"] as string;
  const country   = cfCountry || getCountryFromIp(req.ip || "");

  if (!ALLOWED_COUNTRIES.has(country)) {
    return res.status(403).json({
      error: "Access not available in your region",
      code: "GEO_BLOCKED",
    });
  }
  next();
}
