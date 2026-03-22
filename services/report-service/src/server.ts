import express from "express";
import cors from "cors";
import { reportRouter } from "./controller";
const app = express();
app.use(cors()); app.use(express.json());
app.use("/reports", reportRouter);
app.get("/health", (_, res) => res.json({ service: "report", status: "ok" }));
const PORT = Number(process.env.PORT) || 3034;
app.listen(PORT, () => console.warn(`[report-service] :${PORT}`));
