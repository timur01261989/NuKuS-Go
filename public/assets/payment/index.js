import cardPro from "./cards/payment-card-pro.svg";
import stateErrorSoft from "./states/payment-state-error-soft.svg";
import stateSuccessSoft from "./states/payment-state-success-soft.svg";
import statePaidOff from "./states/payment-state-paid-off.svg";
import splitAction from "./actions/payment-split.png";
import loyaltyCardAlt from "./bonus/payment-loyalty-card-alt.svg";
import bonusExtra from "./bonus/payment-bonus-extra.png";
import walletDefaultAlt from "./bonus/payment-wallet-default-alt.png";
import cardDefault from "./cards/payment-card-default.svg";
import cardDefaultAlt from "./cards/payment-card-default-alt.svg";
import cardVisa from "./cards/payment-card-visa.svg";
import cardVisaAlt from "./cards/payment-card-visa-alt.svg";
import cardMastercard from "./cards/payment-card-mastercard.svg";
import cardMastercardAlt from "./cards/payment-card-mastercard-alt.svg";
import cardMir from "./cards/payment-card-mir.svg";
import cardMirAlt from "./cards/payment-card-mir-alt.svg";
import cardUnionpay from "./cards/payment-card-unionpay.svg";
import cardUnionpayAlt from "./cards/payment-card-unionpay-alt.svg";
import cardGooglePay from "./cards/payment-card-google-pay.svg";
import cardGooglePayAlt from "./cards/payment-card-google-pay-alt.svg";
import cardJcb from "./cards/payment-card-jcb.svg";
import stateSuccess from "./states/payment-state-success.svg";
import stateSuccessAlt from "./states/payment-state-success-alt.svg";
import stateError from "./states/payment-state-error.svg";
import stateErrorAlt from "./states/payment-state-error-alt.svg";
import stateWarning from "./states/payment-state-warning.svg";
import stateWarningAlt from "./states/payment-state-warning-alt.svg";
import addCard from "./actions/payment-add-card.svg";
import addCardAlt from "./actions/payment-add-card-alt.svg";
import loyaltyCard from "./bonus/payment-loyalty-card.svg";
import bonusesImage from "./bonus/payment-bonuses.png";
import bonusBadge from "./bonus/payment-bonus-badge.png";
import walletDefault from "./bonus/payment-wallet-default.png";
import scanAction from "./actions/payment-scan.png";
import qrDelegation from "./actions/payment-qr-delegation.png";

export const paymentAssets = {
  cards: {
    default: cardDefault,
    defaultAlt: cardDefaultAlt,
    visa: cardVisa,
    visaAlt: cardVisaAlt,
    mastercard: cardMastercard,
    mastercardAlt: cardMastercardAlt,
    mir: cardMir,
    mirAlt: cardMirAlt,
    unionpay: cardUnionpay,
    unionpayAlt: cardUnionpayAlt,
    googlePay: cardGooglePay,
    googlePayAlt: cardGooglePayAlt,
    jcb: cardJcb,
    pro: cardPro,
  },
  states: {
    success: stateSuccess,
    successAlt: stateSuccessAlt,
    error: stateError,
    errorAlt: stateErrorAlt,
    warning: stateWarning,
    warningAlt: stateWarningAlt,
    errorSoft: stateErrorSoft,
    successSoft: stateSuccessSoft,
    paidOff: statePaidOff,
  },
  actions: {
    addCard,
    addCardAlt,
    scan: scanAction,
    qrDelegation,
    split: splitAction,
  },
  bonus: {
    loyaltyCard,
    bonusesImage,
    bonusBadge,
    walletDefault,
    loyaltyCardAlt,
    bonusExtra,
    walletDefaultAlt,
  },
};
