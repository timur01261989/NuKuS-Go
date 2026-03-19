import authOtpChallenge from "./auth/auth-otp-challenge.json";
import authLock from "./auth/auth-lock.json";
import statusAwaitLight from "./status/status-await-light.json";
import statusAwaitDark from "./status/status-await-dark.json";
import statusResult from "./status/status-result.json";
import statusConfetti from "./status/status-confetti.json";
import paymentCardBind from "./payment/payment-card-bind.json";
import paymentCardCvv from "./payment/payment-card-cvv.json";
import paymentChallengeFooter from "./payment/payment-challenge-footer.json";
import paymentBankSelect from "./payment/payment-bank-select.json";

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
