import express from "express";
import cors from "cors";
import { routingRouter } from "./controller";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/routing", routingRouter);
app.get("/health", (_, res) => res.json({ service: "routing", status: "ok" }));

const PORT = Number(process.env.PORT) || 3017;
app.listen(PORT, () => console.warn(`[routing-service] :${PORT}`));
