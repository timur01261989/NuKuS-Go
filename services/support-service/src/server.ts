import express from "express";
import cors from "cors";
import { supportRouter } from "./controller";
const app = express();
app.use(cors()); app.use(express.json());
app.use("/support", supportRouter);
app.get("/health", (_, res) => res.json({ service: "support", status: "ok" }));
const PORT = Number(process.env.PORT) || 3031;
app.listen(PORT, () => console.warn(`[support-service] :${PORT}`));
