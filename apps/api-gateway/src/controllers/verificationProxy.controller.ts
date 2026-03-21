import { createProxyMiddleware } from "http-proxy-middleware";
export const verificationProxy_controller = createProxyMiddleware({
  target: process.env.VERIFICATION_SERVICE_URL || "http://verification-service:3021",
  changeOrigin: true,
  pathRewrite: { "^/api/verification": "/verification" },
});
