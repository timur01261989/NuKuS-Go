import { createProxyMiddleware } from "http-proxy-middleware";
export const freightProxyController = createProxyMiddleware({
  target: process.env.FREIGHT_SERVICE_URL || "http://freight-service:3007",
  changeOrigin: true,
  pathRewrite: { "^/api/freight": "/freight" },
});
