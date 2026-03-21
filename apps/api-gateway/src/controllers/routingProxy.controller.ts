import { createProxyMiddleware } from "http-proxy-middleware";
export const routingProxy_controller = createProxyMiddleware({
  target: process.env.ROUTING_SERVICE_URL || "http://routing-service:3017",
  changeOrigin: true,
  pathRewrite: { "^/api/routing": "/routing" },
});
