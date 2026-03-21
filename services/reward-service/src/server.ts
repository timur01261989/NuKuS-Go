import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

app.use(cors());
app.use(express.json());

// Bonuslar va mukofotlar
app.get("/rewards/:userId", async (req, res) => {
  try {
    const { data } = await sb.from("user_rewards")
      .select("*").eq("user_id", req.params.userId);
    res.json(data || []);
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/rewards/earn", async (req, res) => {
  try {
    const { user_id, points, reason, order_id } = req.body;
    const { data } = await sb.from("reward_transactions")
      .insert({ user_id, points, reason, order_id, created_at: new Date().toISOString() })
      .select().single();
    res.json(data);
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/rewards/redeem", async (req, res) => {
  try {
    const { user_id, points } = req.body;
    // Check balance
    const { data: bal } = await sb.from("user_rewards")
      .select("balance").eq("user_id", user_id).single();
    if (!bal || (bal as any).balance < points) {
      return res.status(400).json({ error: "Yetarli bonus yo\'q" });
    }
    await sb.from("user_rewards")
      .update({ balance: (bal as any).balance - points })
      .eq("user_id", user_id);
    res.json({ ok: true, redeemed: points });
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/referrals/:userId", async (req, res) => {
  try {
    const { data } = await sb.from("referrals")
      .select("*").eq("referrer_id", req.params.userId);
    res.json(data || []);
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/health", (_, res) => res.json({ service: "reward", status: "ok" }));

const PORT = Number(process.env.PORT) || 3016;
app.listen(PORT, () => console.warn(`[reward-service] :${PORT}`));
