import { createProxyMiddleware } from "http-proxy-middleware";
export const searchProxyController = createProxyMiddleware({
  target: process.env.SEARCH_SERVICE_URL || "http://search-service:3014",
  changeOrigin: true,
  pathRewrite: { "^/api/search": "/search" },
});
