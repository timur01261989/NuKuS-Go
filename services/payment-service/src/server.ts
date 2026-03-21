import express from "express";
import cors from "cors";
import { BillingService } from "./billing";

const app = express();
const billing = new BillingService();
app.use(cors());
app.use(express.json());

app.post("/payment/initiate", async (req, res) => {
  try {
    const { provider, amount, order_id } = req.body;
    const result = await billing.initiatePayment(provider, amount, order_id);
    res.json(result);
  } catch(e: any) { res.status(400).json({ error: e.message }); }
});
app.get("/health", (_, res) => res.json({ service: "payment", status: "ok" }));

const PORT = Number(process.env.PORT) || 3004;
app.listen(PORT, () => console.warn(`[payment-service] :${PORT}`));
