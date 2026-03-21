import express from "express";
import cors from "cors";
import { searchRouter } from "./controller";
import { esClient, initIndices } from "./elasticsearch.client";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/search", searchRouter);
app.get("/health", async (_, res) => {
  try {
    await esClient.ping();
    res.json({ service: "search", status: "ok", elasticsearch: "connected" });
  } catch {
    res.status(503).json({ service: "search", status: "degraded" });
  }
});

const PORT = Number(process.env.PORT) || 3014;

initIndices().then(() => {
  app.listen(PORT, () => console.warn(`[search-service] :${PORT}`));
}).catch(err => {
  console.error("[search] init failed:", err);
  app.listen(PORT);
});
