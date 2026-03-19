const authOtpChallenge = "./auth/auth-otp-challenge.json";
const authLock = "./auth/auth-lock.json";
const statusAwaitLight = "./status/status-await-light.json";
const statusAwaitDark = "./status/status-await-dark.json";
const statusResult = "./status/status-result.json";
const statusConfetti = "./status/status-confetti.json";
const paymentCardBind = "./payment/payment-card-bind.json";
const paymentCardCvv = "./payment/payment-card-cvv.json";
const paymentChallengeFooter = "./payment/payment-challenge-footer.json";
const paymentBankSelect = "./payment/payment-bank-select.json";

export const lottieAssets = {
  auth: {
    otpChallenge: authOtpChallenge,
    lock: authLock,
  },
  payment: {
    cardBind: paymentCardBind,
    cardCvv: paymentCardCvv,
    challengeFooter: paymentChallengeFooter,
    bankSelect: paymentBankSelect,
  },
  status: {
    awaitLight: statusAwaitLight,
    awaitDark: statusAwaitDark,
    result: statusResult,
    confetti: statusConfetti,
  },
};
