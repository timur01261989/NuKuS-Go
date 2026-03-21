import { createApp } from "./app";

async function bootstrap() {
  const { httpServer } = await createApp();
  const PORT = Number(process.env.WS_PORT) || 3010;
  httpServer.listen(PORT, () => console.warn(`[ws-gateway] :${PORT}`));
}

bootstrap().catch(err => {
  console.error("[ws-gateway] startup failed:", err);
  process.exit(1);
});
