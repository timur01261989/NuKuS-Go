export async function createSettlementBatch({ supabase, batchType = "driver_payout", totalAmount = 0 }) {
  const { data, error } = await supabase
    .from("settlement_batches")
    .insert({
      batch_type: batchType,
      status: "pending",
      total_amount: totalAmount,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function addSettlementItem({
  supabase,
  batchId,
  recipientType,
  recipientId,
  amount,
}) {
  const { data, error } = await supabase
    .from("settlement_items")
    .insert({
      batch_id: batchId,
      recipient_type: recipientType,
      recipient_id: recipientId,
      amount,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
