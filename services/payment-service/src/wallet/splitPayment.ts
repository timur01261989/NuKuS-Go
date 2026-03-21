/**
 * Split Payment Service
 * Allows splitting a ride fare between multiple passengers
 */

export interface SplitRequest {
  order_id: string;
  total_uzs: number;
  participants: { user_id: string; share_percent: number }[];
}

export interface SplitResult {
  order_id: string;
  splits: { user_id: string; amount_uzs: number; status: "pending" | "paid" | "failed" }[];
  total_collected_uzs: number;
}

export class SplitPaymentService {
  /**
   * Create a split payment request
   * Each participant pays their share asynchronously
   */
  async createSplit(req: SplitRequest): Promise<SplitResult> {
    const totalShares = req.participants.reduce((s, p) => s + p.share_percent, 0);
    if (Math.abs(totalShares - 100) > 0.01) {
      throw new Error("Share percentages must sum to 100%");
    }

    const splits = req.participants.map((p) => ({
      user_id: p.user_id,
      amount_uzs: Math.round(req.total_uzs * (p.share_percent / 100)),
      status: "pending" as const,
    }));

    return {
      order_id: req.order_id,
      splits,
      total_collected_uzs: 0,
    };
  }

  /**
   * Confirm individual split payment
   */
  async confirmSplit(
    orderId: string,
    userId: string,
    paymentMethod: "wallet" | "card"
  ): Promise<boolean> {
    // In production: deduct from wallet or charge card
    console.warn(`[split] Confirmed ${orderId} by ${userId} via ${paymentMethod}`);
    return true;
  }

  /**
   * Equal split helper
   */
  equalSplit(userIds: string[]): { user_id: string; share_percent: number }[] {
    const share = parseFloat((100 / userIds.length).toFixed(2));
    return userIds.map((id, i) => ({
      user_id: id,
      share_percent: i === 0 ? 100 - share * (userIds.length - 1) : share,
    }));
  }
}
