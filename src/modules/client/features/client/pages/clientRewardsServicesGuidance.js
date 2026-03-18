export const loyaltyTiers = [
  { key: "bronze", title: "Bronze", rewardState: "starter" },
  { key: "silver", title: "Silver", rewardState: "growing" },
  { key: "gold", title: "Gold", rewardState: "priority" },
  { key: "platinum", title: "Platinum", rewardState: "elite" }
];

export const rewardsSurfaces = {
  promo: ["promo-code", "referral", "personal-goal"],
  debt: ["warning", "freeze", "resolve"],
  autoServices: ["garage", "fuel", "wagon"]
};

export function buildRewardsDashboard({ debt = 0, tier = "bronze" } = {}) {
  return {
    tier,
    debtState: debt > 0 ? "attention" : "clear",
    cards: debt > 0 ? ["reward", "debt", "promo"] : ["reward", "promo", "services"]
  };
}
