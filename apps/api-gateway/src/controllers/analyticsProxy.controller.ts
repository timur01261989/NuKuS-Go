import { createProxyMiddleware } from "http-proxy-middleware";
export const analyticsProxyController = createProxyMiddleware({
  target: process.env.ANALYTICS_SERVICE_URL || "http://analytics-service:3013",
  changeOrigin: true,
  pathRewrite: { "^/api/analytics": "/analytics" },
});
