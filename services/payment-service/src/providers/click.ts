export class ClickProvider {
  private serviceId  = process.env.CLICK_SERVICE_ID  || "";
  private merchantId = process.env.CLICK_MERCHANT_ID || "";
  private secretKey  = process.env.CLICK_SECRET_KEY  || "";

  async createInvoice(amount: number, orderId: string) {
    return {
      url: `https://my.click.uz/services/pay?service_id=${this.serviceId}&merchant_id=${this.merchantId}&amount=${amount}&transaction_param=${orderId}`,
      invoiceId: `click_${orderId}`,
    };
  }
}
