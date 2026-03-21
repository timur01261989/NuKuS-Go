import { createProxyMiddleware } from "http-proxy-middleware";
export const foodProxyController = createProxyMiddleware({
  target: process.env.FOOD_SERVICE_URL || "http://food-service:3011",
  changeOrigin: true,
  pathRewrite: { "^/api/food": "/food" },
});
