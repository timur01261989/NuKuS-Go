import express from "express";
import cors from "cors";
import { authRouter } from "./controller";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/auth", authRouter);
app.get("/health", (_, res) => res.json({ service: "auth", status: "ok" }));

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => console.warn(`[auth-service] :${PORT}`));
