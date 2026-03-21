import express from "express";
import cors from "cors";
import { subscriptionRouter } from "./controller";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/subscription", subscriptionRouter);
app.get("/health", (_, res) => res.json({ service: "subscription", status: "ok" }));

const PORT = Number(process.env.PORT) || 3020;
app.listen(PORT, () => console.warn(`[subscription-service] :${PORT}`));
