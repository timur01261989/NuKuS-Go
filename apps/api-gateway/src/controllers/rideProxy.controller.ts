import { createProxyMiddleware } from "http-proxy-middleware";
export const rideProxyController = createProxyMiddleware({
  target: process.env.RIDE_SERVICE_URL || "http://ride-service:3002", changeOrigin: true,
  pathRewrite: { "^/api/ride": "/ride" },
});
