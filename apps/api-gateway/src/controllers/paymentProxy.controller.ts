import { createProxyMiddleware } from "http-proxy-middleware";
export const paymentProxyController = createProxyMiddleware({
  target: process.env.PAYMENT_SERVICE_URL || "http://payment-service:3004", changeOrigin: true,
  pathRewrite: { "^/api/payment": "/payment" },
});
