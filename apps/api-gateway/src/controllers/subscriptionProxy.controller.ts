import { createProxyMiddleware } from "http-proxy-middleware";
export const subscriptionProxy_controller = createProxyMiddleware({
  target: process.env.SUBSCRIPTION_SERVICE_URL || "http://subscription-service:3020",
  changeOrigin: true,
  pathRewrite: { "^/api/subscription": "/subscription" },
});
