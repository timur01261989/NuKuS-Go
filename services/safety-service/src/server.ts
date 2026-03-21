import express from "express";
import cors from "cors";
import { safetyRouter } from "./controller";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/safety", safetyRouter);
app.get("/health", (_, res) => res.json({ service: "safety", status: "ok" }));

const PORT = Number(process.env.PORT) || 3019;
app.listen(PORT, () => console.warn(`[safety-service] :${PORT}`));
