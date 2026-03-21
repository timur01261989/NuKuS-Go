export const PAYMENT_TOPICS = {
  INITIATED:  "payment.initiated",
  COMPLETED:  "payment.completed",
  FAILED:     "payment.failed",
  REFUNDED:   "payment.refunded",
} as const;

export type PaymentTopic = typeof PAYMENT_TOPICS[keyof typeof PAYMENT_TOPICS];
