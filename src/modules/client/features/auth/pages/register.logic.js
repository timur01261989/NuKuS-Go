
export function getReferralCodeFromSearch(searchParams, normalizeReferralCode) {
  return normalizeReferralCode(searchParams.get("ref") || searchParams.get("referral") || "");
}

export function buildRegisterInitialForm(searchParams, normalizeReferralCode) {
  return {
    name: "",
    surname: "",
    phone: "",
    password: "",
    referralCode: getReferralCodeFromSearch(searchParams, normalizeReferralCode),
    fullPhone: "",
  };
}

export function normalizeOtpValue(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

export function canRequestSignupOtp({ name, surname, phoneDigits, password, tr }) {
  if (!name.trim() || !surname.trim()) return tr('register.fillNameSurname', 'Ism va familiyani kiriting.');
  if (phoneDigits.length !== 9) return tr('register.phoneInvalid', 'Telefon raqam noto‘g‘ri.');
  if (!password || password.length < 6) return tr('register.passwordTooShort', 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak.');
  return null;
}
