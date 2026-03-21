import { createProxyMiddleware } from "http-proxy-middleware";
export const interdistrictProxyController = createProxyMiddleware({
  target: process.env.INTERDISTRICT_SERVICE_URL || "http://interdistrict-service:3012",
  changeOrigin: true,
  pathRewrite: { "^/api/interdistrict": "/interdistrict" },
});
