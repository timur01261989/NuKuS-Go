import { withAuth } from "../_shared/withAuth.js";
import { getServiceSupabase } from "../_shared/supabase.js";
import { createSettlementBatch, addSettlementItem } from "../_shared/payments/settlementService.js";

async function handler(req, res) {
  const supabase = getServiceSupabase();

  if (req.method === "POST") {
    const { action } = req.body || {};

    if (action === "create_batch") {
      const row = await createSettlementBatch({
        supabase,
        batchType: req.body.batch_type,
        totalAmount: req.body.total_amount,
      });
      res.status(200).json({ row });
      return;
    }

    if (action === "add_item") {
      const row = await addSettlementItem({
        supabase,
        batchId: req.body.batch_id,
        recipientType: req.body.recipient_type,
        recipientId: req.body.recipient_id,
        amount: req.body.amount,
      });
      res.status(200).json({ row });
      return;
    }
  }

  res.status(405).json({ error: "method_not_allowed" });
}

export default withAuth(handler);
