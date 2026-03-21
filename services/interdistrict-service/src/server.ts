import express from "express";
import cors from "cors";
import { interdistrictRouter } from "./interdistrict.controller";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/interdistrict", interdistrictRouter);
app.get("/health", (_, res) => res.json({ service: "interdistrict", status: "ok" }));

const PORT = Number(process.env.PORT) || 3012;
app.listen(PORT, () => console.warn(`[interdistrict-service] :${PORT}`));
