export function restorePreferredPhone({ location, currentPhone, normalizePhoneInput }) {
  try {
    const suggestedPhone = getSuggestedPhoneFromLocationCompat(location);
    if (suggestedPhone) {
      return normalizePhoneInput(suggestedPhone);
    }
    const last = localStorage.getItem('last_phone');
    if (last && !currentPhone) {
      return normalizePhoneInput(last);
    }
  } catch {
    return '';
  }
  return '';
}

function getSuggestedPhoneFromLocationCompat(location) {
  const state = location?.state || {};
  return state.phone || state.phoneNumber || state.suggestedPhone || '';
}

export function validateLoginInput({ phone, password, t }) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length !== 9) {
    return { ok: false, message: t.phoneRequired };
  }
  if (!password) {
    return { ok: false, message: t.passwordRequired };
  }
  return { ok: true, digits };
}

export function buildPostLoginProfileUpdate(userId) {
  const nowIso = new Date().toISOString();
  return {
    id: userId,
    role: 'client',
    phone_verified: true,
    last_sign_in_at: nowIso,
    updated_at: nowIso,
  };
}
