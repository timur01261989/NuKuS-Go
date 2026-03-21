import { createClient } from "@supabase/supabase-js";
import { Wallet, WalletTransaction, TxType } from "./wallet.types";
import { v4 as uuid } from "uuid";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export class WalletService {

  async getWallet(userId: string): Promise<Wallet> {
    const { data, error } = await sb.from("wallets")
      .select("*").eq("user_id", userId).single();
    if (error || !data) {
      // Auto-create
      const { data: created } = await sb.from("wallets").insert({
        user_id: userId, balance_uzs: 0, locked_uzs: 0,
        total_earned: 0, total_spent: 0,
        updated_at: new Date().toISOString(),
      }).select().single();
      return created as Wallet;
    }
    return data as Wallet;
  }

  async credit(
    userId: string, amount: number, type: TxType,
    desc: string, orderId?: string, ref?: string
  ): Promise<WalletTransaction> {
    if (amount <= 0) throw new Error("Amount must be positive");
    return this._atomicUpdate(userId, amount, type, desc, orderId, ref);
  }

  async debit(
    userId: string, amount: number, type: TxType,
    desc: string, orderId?: string
  ): Promise<WalletTransaction> {
    if (amount <= 0) throw new Error("Amount must be positive");
    const wallet = await this.getWallet(userId);
    const available = wallet.balance_uzs - wallet.locked_uzs;
    if (available < amount) throw new Error(`Yetarli mablag' yo'q. Mavjud: ${available.toLocaleString("ru")} so'm`);
    return this._atomicUpdate(userId, -amount, type, desc, orderId);
  }

  async lock(userId: string, amount: number, orderId: string): Promise<void> {
    const wallet = await this.getWallet(userId);
    if (wallet.balance_uzs < amount) throw new Error("Yetarli mablag' yo'q");
    await sb.from("wallets").update({
      locked_uzs: wallet.locked_uzs + amount,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);
  }

  async unlock(userId: string, amount: number, orderId: string, charge = true): Promise<void> {
    const wallet = await this.getWallet(userId);
    const newLocked = Math.max(0, wallet.locked_uzs - amount);
    const newBalance = charge ? wallet.balance_uzs - amount : wallet.balance_uzs;
    await sb.from("wallets").update({
      balance_uzs: newBalance, locked_uzs: newLocked,
      total_spent: charge ? wallet.total_spent + amount : wallet.total_spent,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);
    if (charge) {
      await sb.from("wallet_transactions").insert({
        id: uuid(), user_id: userId, type: "ride_payment",
        amount_uzs: -amount, balance_after: newBalance,
        description: `Buyurtma to'lovi`, order_id: orderId,
        created_at: new Date().toISOString(),
      });
    }
  }

  async transfer(fromId: string, toId: string, amount: number, desc: string): Promise<void> {
    await this.debit(fromId, amount, "transfer", `${desc} → ${toId}`);
    await this.credit(toId, amount, "transfer", `${desc} ← ${fromId}`);
  }

  async getTransactions(userId: string, limit = 30, offset = 0): Promise<WalletTransaction[]> {
    const { data } = await sb.from("wallet_transactions")
      .select("*").eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    return (data || []) as WalletTransaction[];
  }

  async getStats(userId: string) {
    const wallet = await this.getWallet(userId);
    const { data: txs } = await sb.from("wallet_transactions")
      .select("type, amount_uzs")
      .eq("user_id", userId);
    const cashbacks = (txs || []).filter((t: any) => t.type === "cashback")
      .reduce((s: number, t: any) => s + t.amount_uzs, 0);
    return {
      ...wallet,
      total_cashback: cashbacks,
      transaction_count: (txs || []).length,
    };
  }

  private async _atomicUpdate(
    userId: string, delta: number, type: TxType,
    desc: string, orderId?: string, ref?: string
  ): Promise<WalletTransaction> {
    const wallet = await this.getWallet(userId);
    const newBalance = wallet.balance_uzs + delta;
    await sb.from("wallets").update({
      balance_uzs: newBalance,
      total_earned: delta > 0 ? wallet.total_earned + delta : wallet.total_earned,
      total_spent:  delta < 0 ? wallet.total_spent  + Math.abs(delta) : wallet.total_spent,
      updated_at:   new Date().toISOString(),
    }).eq("user_id", userId);

    const { data, error } = await sb.from("wallet_transactions").insert({
      id: uuid(), user_id: userId, type,
      amount_uzs: delta, balance_after: newBalance,
      description: desc, order_id: orderId, reference: ref,
      created_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return data as WalletTransaction;
  }
}
