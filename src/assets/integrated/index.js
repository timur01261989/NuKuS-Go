import paymentBankSelectorRich from "./payment/payment-bank-selector-rich.json";
import paymentCvvCheckRich from "./payment/payment-cvv-check-rich.json";
import paymentGooseDay from "./payment/payment-goose-day.json";
import paymentGooseNight from "./payment/payment-goose-night.json";
import financeTopUp from "./payment/finance-top-up.svg";
import financeWithdraw from "./payment/finance-withdraw.svg";
import financeSplit from "./payment/finance-split.svg";
import financeCardPro from "./payment/finance-card-pro.svg";

import supportFeedbackLike from "./support/support-feedback-like.json";
import supportHelpBadge from "./support/support-help-badge.svg";
import chatReadRich from "./support/chat-read-rich.svg";
import chatSentRich from "./support/chat-sent-rich.svg";
import chatTimeRich from "./support/chat-time-rich.svg";

import authOnboardingTaxi from "./auth/auth-onboarding-taxi.webp";
import authOnboardingIntercity from "./auth/auth-onboarding-intercity.webp";
import authUserOrb from "./auth/auth-user-orb.webp";
import profileStatusWaiting from "./auth/profile-status-waiting.svg";
import profilePreferencesBadge from "./auth/profile-preferences-badge.svg";

import promoInviteBanner from "./promo/promo-invite-banner.webp";
import promoInviteBannerDark from "./promo/promo-invite-banner-dark.webp";
import promoReferralSuccess from "./promo/promo-referral-success.webp";
import rewardMedalBronze from "./promo/reward-medal-bronze.webp";
import rewardMedalSilver from "./promo/reward-medal-silver.webp";
import rewardMedalGold from "./promo/reward-medal-gold.webp";
import rewardMedalPlatinum from "./promo/reward-medal-platinum.webp";

import mapControlLayers from "./map/map-control-layers.png";
import mapControlFilter from "./map/map-control-filter.png";
import mapControlHelp from "./map/map-control-help.png";
import mapControlLocation from "./map/map-control-location.png";
import mapControlFinish from "./map/map-control-finish.png";
import rideSearchCar from "./map/ride-search-car.webp";
import rideSearchOrigin from "./map/ride-search-origin.webp";

export const integratedAssets = {
  payment: {
    bankSelectorRich: paymentBankSelectorRich,
    cvvCheckRich: paymentCvvCheckRich,
    gooseDay: paymentGooseDay,
    gooseNight: paymentGooseNight,
    icons: {
      topUp: financeTopUp,
      withdraw: financeWithdraw,
      split: financeSplit,
      cardPro: financeCardPro,
    },
  },
  support: {
    feedbackLike: supportFeedbackLike,
    helpBadge: supportHelpBadge,
    chatMeta: {
      read: chatReadRich,
      sent: chatSentRich,
      time: chatTimeRich,
    },
  },
  auth: {
    onboardingTaxi: authOnboardingTaxi,
    onboardingIntercity: authOnboardingIntercity,
    userOrb: authUserOrb,
    profileStatusWaiting,
    profilePreferencesBadge,
  },
  promo: {
    inviteBanner: promoInviteBanner,
    inviteBannerDark: promoInviteBannerDark,
    referralSuccess: promoReferralSuccess,
    medals: {
      bronze: rewardMedalBronze,
      silver: rewardMedalSilver,
      gold: rewardMedalGold,
      platinum: rewardMedalPlatinum,
    },
  },
  map: {
    controls: {
      layers: mapControlLayers,
      filter: mapControlFilter,
      help: mapControlHelp,
      location: mapControlLocation,
      finish: mapControlFinish,
    },
    ride: {
      searchCar: rideSearchCar,
      searchOrigin: rideSearchOrigin,
    },
  },
};
