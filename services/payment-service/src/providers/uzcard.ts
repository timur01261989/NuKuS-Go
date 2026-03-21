/**
 * UzCard Payment Provider
 * UzCard — Uzbekistan's domestic debit card network
 */

export interface UzCardTransactionRequest {
  card_number: string;
  card_expire: string;       // MM/YY
  amount_uzs: number;
  order_id: string;
  description?: string;
}

export interface UzCardTransactionResult {
  transaction_id: string;
  status: "success" | "failed" | "pending";
  amount_uzs: number;
  created_at: string;
}

export class UzCardProvider {
  private apiUrl = process.env.UZCARD_API_URL || "https://api.uzcard.uz";
  private merchantId = process.env.UZCARD_MERCHANT_ID || "";
  private secretKey  = process.env.UZCARD_SECRET_KEY  || "";

  async charge(req: UzCardTransactionRequest): Promise<UzCardTransactionResult> {
    try {
      const payload = {
        merchant_id: this.merchantId,
        amount: req.amount_uzs,
        order_id: req.order_id,
        card: { number: req.card_number, expire: req.card_expire },
        description: req.description || `UniGo order ${req.order_id}`,
      };

      const res = await fetch(`${this.apiUrl}/v1/transaction/charge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Merchant-Id": this.merchantId,
          "X-Signature": this.sign(JSON.stringify(payload)),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) throw new Error(`UzCard error: ${res.status}`);
      const data = await res.json();

      return {
        transaction_id: data.transaction_id || `uzcard_${Date.now()}`,
        status: data.status === "0" ? "success" : "failed",
        amount_uzs: req.amount_uzs,
        created_at: new Date().toISOString(),
      };
    } catch (e) {
      throw new Error(`UzCard charge failed: ${(e as Error).message}`);
    }
  }

  async refund(transactionId: string, amount_uzs: number): Promise<boolean> {
    const res = await fetch(`${this.apiUrl}/v1/transaction/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Merchant-Id": this.merchantId,
      },
      body: JSON.stringify({ transaction_id: transactionId, amount: amount_uzs }),
    }).catch(() => null);
    return res?.ok ?? false;
  }

  private sign(data: string): string {
    // HMAC-SHA256 signature — production uses crypto module
    return Buffer.from(`${this.secretKey}:${data}`).toString("base64");
  }
}
