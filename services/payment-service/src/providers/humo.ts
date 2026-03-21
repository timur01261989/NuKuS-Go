/**
 * Humo Payment Provider
 * Humo — Uzbekistan's second domestic card network
 */

export class HumoProvider {
  private apiUrl     = process.env.HUMO_API_URL     || "https://api.humo.uz";
  private merchantId = process.env.HUMO_MERCHANT_ID || "";
  private apiKey     = process.env.HUMO_API_KEY     || "";

  async createInvoice(amount_uzs: number, orderId: string, description?: string) {
    try {
      const res = await fetch(`${this.apiUrl}/v2/invoice/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          merchant_id: this.merchantId,
          amount: amount_uzs,
          currency: "UZS",
          order_id: orderId,
          description: description || `UniGo #${orderId}`,
          callback_url: `${process.env.API_BASE_URL}/api/payment/humo/callback`,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) throw new Error(`Humo error: ${res.status}`);
      const data = await res.json();
      return {
        invoice_id: data.invoice_id,
        payment_url: data.payment_url,
        qr_code: data.qr_code,
        expires_at: data.expires_at,
      };
    } catch (e) {
      throw new Error(`Humo invoice failed: ${(e as Error).message}`);
    }
  }

  async checkStatus(invoiceId: string): Promise<"paid" | "pending" | "failed"> {
    const res = await fetch(`${this.apiUrl}/v2/invoice/${invoiceId}`, {
      headers: { "Authorization": `Bearer ${this.apiKey}` },
    }).catch(() => null);
    if (!res?.ok) return "pending";
    const data = await res.json();
    return data.status === "PAID" ? "paid" : data.status === "FAILED" ? "failed" : "pending";
  }
}
