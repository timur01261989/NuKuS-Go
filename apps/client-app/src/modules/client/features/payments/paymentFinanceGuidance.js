export const financeQuickActions = [
  { key: "top-up", title: "Balansni to‘ldirish", style: "primary" },
  { key: "withdraw", title: "Pul yechish", style: "secondary" },
  { key: "split", title: "To‘lovni bo‘lish", style: "secondary" },
  { key: "credit", title: "Kredit mahsulotlari", style: "muted" }
];

export const securePaymentChallengeFlow = [
  { key: "select-bank", title: "Bankni tanlash" },
  { key: "confirm-card", title: "Karta ma’lumotini tasdiqlash" },
  { key: "confirm-code", title: "Kod orqali tasdiqlash" },
  { key: "complete", title: "To‘lov usuli tayyor" }
];

export function buildFinanceOverview({ balance = 0, hasPromo = false, pendingChallenge = false } = {}) {
  return {
    balance,
    emphasis: pendingChallenge ? "secure-check" : "ready",
    sections: [
      hasPromo ? "promo" : "standard",
      balance > 0 ? "available-balance" : "top-up"
    ]
  };
}
