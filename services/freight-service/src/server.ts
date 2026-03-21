import express from "express";
import cors from "cors";
import { freightRouter } from "./freight.controller";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/freight", freightRouter);
app.get("/health", (_, res) => res.json({ service: "freight", status: "ok" }));

const PORT = Number(process.env.PORT) || 3007;
app.listen(PORT, () => console.warn(`[freight-service] :${PORT}`));
