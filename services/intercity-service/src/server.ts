import express from "express";
import cors from "cors";
import { intercityRouter } from "./intercity.controller";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/intercity", intercityRouter);
app.get("/health", (_, res) => res.json({ service: "intercity", status: "ok" }));

const PORT = Number(process.env.PORT) || 3008;
app.listen(PORT, () => console.warn(`[intercity-service] :${PORT}`));
