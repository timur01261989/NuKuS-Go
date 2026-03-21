import express from "express";
import cors from "cors";
import { matchingRouter } from "./matchingGateway";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/matching", matchingRouter);
app.get("/health", (_, res) => res.json({ service: "matching", status: "ok" }));

const PORT = Number(process.env.PORT) || 3015;
app.listen(PORT, () => console.warn(`[matching-service] :${PORT}`));
