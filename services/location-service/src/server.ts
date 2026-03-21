import express from "express";
import cors from "cors";
import { locationRouter } from "./gateway";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/location", locationRouter);
app.get("/health", (_, res) => res.json({ service: "location", status: "ok" }));

const PORT = Number(process.env.PORT) || 3005;
app.listen(PORT, () => console.warn(`[location-service] :${PORT}`));
