import { createProxyMiddleware } from "http-proxy-middleware";

const WS_GATEWAY_URL = process.env.WS_GATEWAY_URL || "http://ws-gateway:3010";

export const wsProxyController = createProxyMiddleware({
  target: WS_GATEWAY_URL,
  changeOrigin: true,
  ws: true, // WebSocket proxy
  pathRewrite: { "^/ws": "" },
  on: {
    error: (err: any, req: any, res: any) => {
      if (res && typeof res.status === "function") {
        res.status(502).json({ error: "WebSocket gateway unavailable" });
      }
    },
  },
});
