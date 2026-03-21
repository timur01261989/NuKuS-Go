import express from "express";
import cors from "cors";
import { chatRouter } from "./controller";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use("/chat", chatRouter);
app.get("/health", (_, res) => res.json({ service: "chat", status: "ok" }));

const PORT = Number(process.env.PORT) || 3023;
app.listen(PORT, () => console.warn(`[chat-service] :${PORT}`));
