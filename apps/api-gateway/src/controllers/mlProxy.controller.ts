import { createProxyMiddleware } from "http-proxy-middleware";
export const mlProxyController = createProxyMiddleware({
  target: process.env.ML_SERVICE_URL || "http://ml-service:8000",
  changeOrigin: true,
  pathRewrite: { "^/api/ml": "" },
});
