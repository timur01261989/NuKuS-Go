import express from "express";
import cors from "cors";
import { analyticsRouter } from "./controller";
import { clickhouse, initSchema } from "./clickhouse.client";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use("/analytics", analyticsRouter);
app.get("/health", async (_, res) => {
  try {
    await clickhouse.ping();
    res.json({ service: "analytics", status: "ok", clickhouse: "connected" });
  } catch {
    res.status(503).json({ service: "analytics", status: "degraded", clickhouse: "disconnected" });
  }
});

const PORT = Number(process.env.PORT) || 3013;

initSchema().then(() => {
  app.listen(PORT, () => console.warn(`[analytics-service] :${PORT}`));
}).catch(err => {
  console.error("[analytics] schema init failed:", err);
  app.listen(PORT, () => console.warn(`[analytics-service] :${PORT} (schema init failed)`));
});
