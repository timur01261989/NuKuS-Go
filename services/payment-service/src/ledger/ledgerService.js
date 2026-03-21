export async function createLedgerEntry({
  supabase,
  accountId,
  entryType,
  amount,
  referenceType = null,
  referenceId = null,
  transactionId = null,
}) {
  const payload = {
    transaction_id: transactionId || crypto.randomUUID(),
    account_id: accountId,
    entry_type: entryType,
    amount,
    reference_type: referenceType,
    reference_id: referenceId,
  };

  const { data, error } = await supabase
    .from("ledger_entries")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
