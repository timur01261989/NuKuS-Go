export const REGISTER_OTP_META_INITIAL = {
  expiresAt: null,
  requestId: null,
  cooldownSeconds: 0,
  deliveryChannel: null,
};

export const REGISTER_REFERRAL_STATUS_INITIAL = {
  loading: false,
  valid: false,
  inviterName: '',
  inviterRewardUzs: 0,
  error: '',
};

export function getRegisterStepCopy({ step, tr, formData, otpMeta, otp }) {
  if (step === 2) {
    const maskedPhone = formData?.fullPhone || '';
    return {
      title: tr('register.verifyOtpTitle', 'Tasdiqlash kodi'),
      subtitle: tr('register.verifyOtpSubtitle', `${maskedPhone} raqamiga yuborilgan 6 xonali kodni kiriting.`),
      actionDisabled: String(otp || '').replace(/\D/g, '').length < 6,
      actionLabel: tr('register.verifyOtpButton', 'Tasdiqlash'),
      cooldownSeconds: Number(otpMeta?.cooldownSeconds || 0),
    };
  }

  return {
    title: tr('register.title', 'Ro‘yxatdan o‘tish'),
    subtitle: tr('register.subtitle', 'Yangi akkaunt yaratish uchun ma’lumotlarni kiriting.'),
    actionDisabled: false,
    actionLabel: tr('register.getOtpButton', 'Kod olish'),
    cooldownSeconds: 0,
  };
}
