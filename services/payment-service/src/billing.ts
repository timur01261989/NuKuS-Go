import { PaymeProvider } from "./providers/payme";
import { ClickProvider } from "./providers/click";

export class BillingService {
  private payme = new PaymeProvider();
  private click = new ClickProvider();

  async initiatePayment(provider: "payme" | "click", amount: number, orderId: string) {
    if (provider === "payme") return this.payme.createTransaction(amount, orderId);
    if (provider === "click") return this.click.createInvoice(amount, orderId);
    throw new Error(`Unknown provider: ${provider}`);
  }

  async getWalletBalance(userId: string): Promise<number> {
    // TODO: fetch from wallet table
    return 0;
  }

  async deductFromWallet(userId: string, amount: number): Promise<boolean> {
    // TODO: atomic wallet deduction
    return false;
  }
}
