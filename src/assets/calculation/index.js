import tariffEconomy from './tariffs/tariff-economy.webp';
import tariffComfort from './tariffs/tariff-comfort.webp';
import tariffComfortPlus from './tariffs/tariff-comfort-plus.webp';
import tariffBusiness from './tariffs/tariff-business.webp';
import pricingAccess from './pricing/pricing-access.svg';
import pricingSurgeUp from './pricing/pricing-surge-up.svg';
import pricingDown from './pricing/pricing-down.svg';
import pricingFair from './pricing/pricing-fair.svg';
import pricingUp from './pricing/pricing-up.svg';
import paymentArtCard from './payment/payment-art-card.webp';
import paymentArtDetails from './payment/payment-art-details.webp';
import paymentArtPro from './payment/payment-art-pro.webp';
import promoCodeEntry from './promo/promo-code-entry.svg';
import promoBadgeFill from './promo/promo-badge-fill.svg';
import promoBadgeOutline from './promo/promo-badge-outline.svg';
import promoGoalFlag from './promo/promo-goal-flag.webp';
import promoReferralCode from './promo/promo-referral-code.png';

export {
  tariffEconomy,
  tariffComfort,
  tariffComfortPlus,
  tariffBusiness,
  pricingAccess,
  pricingSurgeUp,
  pricingDown,
  pricingFair,
  pricingUp,
  paymentArtCard,
  paymentArtDetails,
  paymentArtPro,
  promoCodeEntry,
  promoBadgeFill,
  promoBadgeOutline,
  promoGoalFlag,
  promoReferralCode,
};

export const calculationAssets = {
  tariffs: {
    economy: tariffEconomy,
    comfort: tariffComfort,
    comfortPlus: tariffComfortPlus,
    business: tariffBusiness,
  },
  pricing: {
    access: pricingAccess,
    surgeUp: pricingSurgeUp,
    down: pricingDown,
    fair: pricingFair,
    up: pricingUp,
  },
  payment: {
    card: paymentArtCard,
    details: paymentArtDetails,
    pro: paymentArtPro,
  },
  promo: {
    codeEntry: promoCodeEntry,
    badgeFill: promoBadgeFill,
    badgeOutline: promoBadgeOutline,
    goalFlag: promoGoalFlag,
    referralCode: promoReferralCode,
  },
};
