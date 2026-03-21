import { createProxyMiddleware } from "http-proxy-middleware";
export const promoProxy_controller = createProxyMiddleware({
  target: process.env.PROMO_SERVICE_URL || "http://promo-service:3022",
  changeOrigin: true,
  pathRewrite: { "^/api/promo": "/promo" },
});
