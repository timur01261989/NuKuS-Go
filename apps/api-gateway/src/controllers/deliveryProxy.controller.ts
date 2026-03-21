import { createProxyMiddleware } from "http-proxy-middleware";
export const deliveryProxyController = createProxyMiddleware({
  target: process.env.DELIVERY_SERVICE_URL || "http://delivery-service:3003", changeOrigin: true,
  pathRewrite: { "^/api/delivery": "/delivery" },
});
