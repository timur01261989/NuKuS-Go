import express from "express";
import cors from "cors";
import { earningsRouter } from "./controller";
const app = express();
app.use(cors()); app.use(express.json());
app.use("/earnings", earningsRouter);
app.get("/health", (_, res) => res.json({ service: "earnings", status: "ok" }));
const PORT = Number(process.env.PORT) || 3025;
app.listen(PORT, () => console.warn(`[earnings-service] :${PORT}`));
