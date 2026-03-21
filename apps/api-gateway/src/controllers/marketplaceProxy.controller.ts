import { createProxyMiddleware } from "http-proxy-middleware";
export const marketplaceProxyController = createProxyMiddleware({
  target: process.env.MARKETPLACE_SERVICE_URL || "http://marketplace-service:3009",
  changeOrigin: true,
  pathRewrite: { "^/api/marketplace": "/marketplace" },
});
