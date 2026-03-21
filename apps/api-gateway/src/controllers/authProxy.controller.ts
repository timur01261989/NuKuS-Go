import { createProxyMiddleware } from "http-proxy-middleware";
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:3001";
export const authProxyController = createProxyMiddleware({
  target: AUTH_SERVICE_URL, changeOrigin: true,
  pathRewrite: { "^/api/auth": "/auth" },
  on: { error: (err: any, req: any, res: any) => res.status(502).json({ error: "Auth service unavailable" }) },
});
