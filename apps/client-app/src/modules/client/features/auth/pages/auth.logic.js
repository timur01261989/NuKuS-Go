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

/**
 * Login keyin profiles upsert uchun.
 * @param {string | { user?: { id: string }, id?: string, fullPhone?: string, nowIso?: string }} input
 *   — string: faqat user id (testlar / soddalashtirish)
 *   — obyekt: { user, fullPhone?, nowIso? } — useLoginController bilan mos
 */
export function buildPostLoginProfileUpdate(input) {
  const nowIso =
    typeof input === "object" && input && input.nowIso
      ? input.nowIso
      : new Date().toISOString();
  const userId =
    typeof input === "string" ? input : input?.user?.id ?? input?.id ?? null;
  if (!userId) {
    throw new Error("buildPostLoginProfileUpdate: user id kerak");
  }
  const row = {
    id: userId,
    role: "client",
    phone_verified: true,
    last_sign_in_at: nowIso,
    updated_at: nowIso,
  };
  if (typeof input === "object" && input?.fullPhone) {
    row.phone = input.fullPhone;
  }
  return row;
}
