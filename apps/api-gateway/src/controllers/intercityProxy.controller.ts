import { createProxyMiddleware } from "http-proxy-middleware";
export const intercityProxyController = createProxyMiddleware({
  target: process.env.INTERCITY_SERVICE_URL || "http://intercity-service:3008",
  changeOrigin: true,
  pathRewrite: { "^/api/intercity": "/intercity" },
});
