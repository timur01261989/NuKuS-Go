import express from "express";
import cors from "cors";
import { fleetRouter } from "./controller";
const app = express();
app.use(cors()); app.use(express.json());
app.use("/fleet", fleetRouter);
app.get("/health", (_, res) => res.json({ service: "fleet", status: "ok" }));
const PORT = Number(process.env.PORT) || 3032;
app.listen(PORT, () => console.warn(`[fleet-service] :${PORT}`));
