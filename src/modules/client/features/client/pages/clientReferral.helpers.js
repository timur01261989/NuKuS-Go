import {
  getOwnReferralSnapshot,
} from '@/services/referralLinkService.js';

export function formatMoney(language, amount) {
  const normalizedAmount = Math.max(0, Math.round(Number(amount || 0)));
  try {
    return new Intl.NumberFormat(language === 'uz_kir' ? 'uz-Cyrl-UZ' : 'uz-UZ').format(normalizedAmount);
  } catch {
    return String(normalizedAmount);
  }
}

export function mergeReferralState(response, previousState = null) {
  const cached = getOwnReferralSnapshot();
  return {
    code: response?.code || previousState?.code || cached?.code || null,
    summary: response?.summary || previousState?.summary || cached?.summary || null,
    shareUrl:
      response?.shareUrl ||
      previousState?.shareUrl ||
      cached?.shareUrl ||
      null,
    messageTemplate:
      response?.messageTemplate ||
      previousState?.messageTemplate ||
      cached?.messageTemplate ||
      null,
    rewardAmountUzs:
      Number(
        response?.rewardAmountUzs ??
          previousState?.rewardAmountUzs ??
          cached?.rewardAmountUzs ??
          0
      ) || 0,
  };
}
