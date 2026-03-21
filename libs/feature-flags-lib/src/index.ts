export interface FeatureFlags {
  autoMarket: boolean;
  foodDelivery: boolean;
  intercityRide: boolean;
  surgePrice: boolean;
  loyaltyRewards: boolean;
  voiceNavigation: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  autoMarket:     true,
  foodDelivery:   false,
  intercityRide:  true,
  surgePrice:     false,
  loyaltyRewards: true,
  voiceNavigation: false,
};

export function getFlags(env: "development" | "production" | "staging" = "production"): FeatureFlags {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const envFlags = require(`../../feature-flags/environments.json`)[env] || {};
    return { ...DEFAULT_FLAGS, ...envFlags };
  } catch { return DEFAULT_FLAGS; }
}

export function isEnabled(flag: keyof FeatureFlags, env?: "development" | "production" | "staging"): boolean {
  return getFlags(env)[flag] === true;
}
