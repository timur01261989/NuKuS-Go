import express from "express";
import cors from "cors";
import { featureRouter } from "./controller";
const app = express();
app.use(cors()); app.use(express.json());
app.use("/features", featureRouter);
app.get("/health", (_, res) => res.json({ service: "feature-store", status: "ok" }));
const PORT = Number(process.env.PORT) || 3030;
app.listen(PORT, () => console.warn(`[feature-store-service] :${PORT}`));
