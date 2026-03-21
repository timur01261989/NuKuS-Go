import { createProxyMiddleware } from "http-proxy-middleware";
export const rewardProxyController = createProxyMiddleware({
  target: process.env.REWARD_SERVICE_URL || "http://reward-service:3016",
  changeOrigin: true,
  pathRewrite: { "^/api/rewards": "/rewards" },
});
