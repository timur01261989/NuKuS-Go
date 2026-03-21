import { createProxyMiddleware } from "http-proxy-middleware";
export const corporateProxy_controller = createProxyMiddleware({
  target: process.env.CORPORATE_SERVICE_URL || "http://corporate-service:3018",
  changeOrigin: true,
  pathRewrite: { "^/api/corporate": "/corporate" },
});
