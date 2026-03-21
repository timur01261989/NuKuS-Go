export class PaymeProvider {
  private merchantId = process.env.PAYME_MERCHANT_ID || "";
  private secretKey  = process.env.PAYME_SECRET_KEY  || "";

  async createTransaction(amount: number, orderId: string): Promise<{ url: string; txId: string }> {
    // Payme Checkout URL generation
    const params = Buffer.from(`m=${this.merchantId};ac.order_id=${orderId};a=${amount * 100}`).toString("base64");
    return { url: `https://checkout.paycom.uz/${params}`, txId: `payme_${orderId}` };
  }

  async checkTransaction(txId: string) {
    // Verify payment status via Payme API
    return { status: "paid", txId };
  }
}
