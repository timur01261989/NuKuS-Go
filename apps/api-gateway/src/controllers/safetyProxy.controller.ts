import { createProxyMiddleware } from "http-proxy-middleware";
export const safetyProxy_controller = createProxyMiddleware({
  target: process.env.SAFETY_SERVICE_URL || "http://safety-service:3019",
  changeOrigin: true,
  pathRewrite: { "^/api/safety": "/safety" },
});
