import express from "express";
import cors from "cors";
import { marketplaceRouter } from "./marketplace.controller";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/marketplace", marketplaceRouter);
app.get("/health", (_, res) => res.json({ service: "marketplace", status: "ok" }));

const PORT = Number(process.env.PORT) || 3009;
app.listen(PORT, () => console.warn(`[marketplace-service] :${PORT}`));
