const cardPro = "./cards/payment-card-pro.svg";
const stateErrorSoft = "./states/payment-state-error-soft.svg";
const stateSuccessSoft = "./states/payment-state-success-soft.svg";
const statePaidOff = "./states/payment-state-paid-off.svg";
import splitAction from "./actions/payment-split.png";
const loyaltyCardAlt = "./bonus/payment-loyalty-card-alt.svg";
import bonusExtra from "./bonus/payment-bonus-extra.png";
import walletDefaultAlt from "./bonus/payment-wallet-default-alt.png";
const cardDefault = "./cards/payment-card-default.svg";
const cardDefaultAlt = "./cards/payment-card-default-alt.svg";
const cardVisa = "./cards/payment-card-visa.svg";
const cardVisaAlt = "./cards/payment-card-visa-alt.svg";
const cardMastercard = "./cards/payment-card-mastercard.svg";
const cardMastercardAlt = "./cards/payment-card-mastercard-alt.svg";
const cardMir = "./cards/payment-card-mir.svg";
const cardMirAlt = "./cards/payment-card-mir-alt.svg";
const cardUnionpay = "./cards/payment-card-unionpay.svg";
const cardUnionpayAlt = "./cards/payment-card-unionpay-alt.svg";
const cardGooglePay = "./cards/payment-card-google-pay.svg";
const cardGooglePayAlt = "./cards/payment-card-google-pay-alt.svg";
const cardJcb = "./cards/payment-card-jcb.svg";
const stateSuccess = "./states/payment-state-success.svg";
const stateSuccessAlt = "./states/payment-state-success-alt.svg";
const stateError = "./states/payment-state-error.svg";
const stateErrorAlt = "./states/payment-state-error-alt.svg";
const stateWarning = "./states/payment-state-warning.svg";
const stateWarningAlt = "./states/payment-state-warning-alt.svg";
const addCard = "./actions/payment-add-card.svg";
const addCardAlt = "./actions/payment-add-card-alt.svg";
const loyaltyCard = "./bonus/payment-loyalty-card.svg";
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
