/**
 * ML-based Fraud Detection
 * Scores transactions on risk (0-100)
 * High-risk transactions (>70) are flagged for review
 */

export interface TransactionContext {
  user_id: string;
  amount_uzs: number;
  payment_method: string;
  ip_address?: string;
  device_id?: string;
  location?: { lat: number; lng: number };
  user_history: {
    total_transactions: number;
    avg_amount_uzs: number;
    failed_transactions: number;
    account_age_days: number;
    last_transaction_at?: string;
  };
}

export interface FraudScore {
  score: number;              // 0-100 (higher = more risky)
  risk_level: "low" | "medium" | "high" | "critical";
  flags: string[];
  action: "allow" | "review" | "block";
}

export function scoreFraud(ctx: TransactionContext): FraudScore {
  let score = 0;
  const flags: string[] = [];

  // Amount anomaly — 3x above average
  if (ctx.user_history.avg_amount_uzs > 0) {
    const ratio = ctx.amount_uzs / ctx.user_history.avg_amount_uzs;
    if (ratio > 10) { score += 40; flags.push("EXTREME_AMOUNT"); }
    else if (ratio > 5) { score += 25; flags.push("LARGE_AMOUNT"); }
    else if (ratio > 3) { score += 10; flags.push("HIGH_AMOUNT"); }
  }

  // New account with large transaction
  if (ctx.user_history.account_age_days < 7) {
    score += 20; flags.push("NEW_ACCOUNT");
  }

  // High failure rate
  const failRate = ctx.user_history.failed_transactions / Math.max(ctx.user_history.total_transactions, 1);
  if (failRate > 0.5) { score += 30; flags.push("HIGH_FAILURE_RATE"); }
  else if (failRate > 0.2) { score += 10; flags.push("ELEVATED_FAILURE_RATE"); }

  // Velocity check — rapid transactions
  if (ctx.user_history.last_transaction_at) {
    const msSinceLast = Date.now() - new Date(ctx.user_history.last_transaction_at).getTime();
    if (msSinceLast < 30_000) { score += 25; flags.push("VELOCITY_ALERT"); }
    else if (msSinceLast < 120_000) { score += 10; flags.push("RAPID_TRANSACTION"); }
  }

  // No transaction history
  if (ctx.user_history.total_transactions === 0) {
    score += 15; flags.push("NO_HISTORY");
  }

  score = Math.min(100, score);
  const risk_level =
    score >= 80 ? "critical" :
    score >= 60 ? "high" :
    score >= 30 ? "medium" : "low";

  const action =
    score >= 80 ? "block" :
    score >= 50 ? "review" : "allow";

  return { score, risk_level, flags, action };
}
