import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export interface WalletBalance {
  user_id: string;
  balance_uzs: number;
  bonus_uzs: number;   // Non-withdrawable bonus coins
  updated_at: string;
}

export class WalletService {
  async getBalance(userId: string): Promise<WalletBalance> {
    const { data } = await sb.from("wallets")
      .select("user_id, balance_uzs, bonus_uzs, updated_at")
      .eq("user_id", userId).single();
    if (!data) {
      // Auto-create wallet
      const { data: newWallet } = await sb.from("wallets")
        .insert({ user_id: userId, balance_uzs: 0, bonus_uzs: 0 })
        .select().single();
      return newWallet as WalletBalance;
    }
    return data as WalletBalance;
  }

  async topUp(userId: string, amount_uzs: number, source: string): Promise<WalletBalance> {
    const { data, error } = await sb.rpc("wallet_top_up", {
      p_user_id: userId,
      p_amount: amount_uzs,
      p_source: source,
    });
    if (error) throw error;
    return this.getBalance(userId);
  }

  /**
   * Deduct from wallet — atomic with row lock
   * Returns false if insufficient balance
   */
  async deduct(userId: string, amount_uzs: number, reference: string): Promise<boolean> {
    const { data, error } = await sb.rpc("wallet_deduct", {
      p_user_id: userId,
      p_amount: amount_uzs,
      p_reference: reference,
    });
    if (error) return false;
    return data === true;
  }

  async addBonus(userId: string, bonus_uzs: number, reason: string): Promise<void> {
    await sb.from("wallet_transactions").insert({
      user_id: userId,
      type: "bonus",
      amount_uzs: bonus_uzs,
      reference: reason,
      created_at: new Date().toISOString(),
    });
    await sb.from("wallets")
      .update({ bonus_uzs: sb.rpc("get_bonus", { p_user_id: userId }) })
      .eq("user_id", userId);
  }

  async getTransactions(userId: string, limit = 30) {
    const { data } = await sb.from("wallet_transactions")
      .select("*").eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(limit);
    return data || [];
  }
}
