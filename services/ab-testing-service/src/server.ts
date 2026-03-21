import express from "express";
import cors from "cors";
import { abRouter } from "./controller";
const app = express();
app.use(cors()); app.use(express.json());
app.use("/ab", abRouter);
app.get("/health", (_, res) => res.json({ service: "ab-testing", status: "ok" }));
const PORT = Number(process.env.PORT) || 3026;
app.listen(PORT, () => console.warn(`[ab-testing-service] :${PORT}`));
