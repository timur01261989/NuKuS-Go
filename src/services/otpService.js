import { supabase } from '@/services/supabase/supabaseClient';

function buildReadableFunctionMessage(payload, fallbackMessage) {
  if (!payload || typeof payload !== 'object') {
    return String(fallbackMessage || 'Xato yuz berdi');
  }

  const baseMessage = String(
    payload.error || payload.message || payload.details || fallbackMessage || 'Xato yuz berdi'
  );

  if (Number(payload.retry_after_seconds) > 0) {
    return `${baseMessage}. ${Number(payload.retry_after_seconds)} soniya kuting.`;
  }

  if (payload.debug_step && payload.details) {
    return `${baseMessage} (${String(payload.debug_step)}: ${String(payload.details)})`;
  }

  return baseMessage;
}

async function extractFunctionError(error, fallbackMessage) {
  if (!error) return null;

  const context = error?.context;
  if (context && typeof context === 'object' && typeof context.text === 'function') {
    try {
      const rawText = await context.text();
      if (rawText) {
        try {
          const parsed = JSON.parse(rawText);
          return buildReadableFunctionMessage(parsed, fallbackMessage);
        } catch {
          return String(rawText);
        }
      }
    } catch {
      // ignore low-level body parsing issues
    }
  }

  return buildReadableFunctionMessage(
    {
      error: error?.message,
      details: error?.context?.details || error?.context?.error,
    },
    fallbackMessage,
  );
}

async function assertFunctionResult(error, fallbackMessage) {
  if (!error) return;
  throw new Error(await extractFunctionError(error, fallbackMessage));
}

function mapOtpResponse(data, phone, purpose, defaultMessage) {
  return {
    success: !!data?.success,
    phone: data?.phone || phone,
    purpose: data?.purpose || purpose,
    expiresInSeconds: Number(data?.expires_in_seconds || 180),
    resendCooldownSeconds: Number(data?.resend_cooldown_seconds || 60),
    retryAfterSeconds: Number(data?.retry_after_seconds || 0),
    message: data?.message || defaultMessage,
    verifiedAt: data?.verified_at || null,
    updatedAt: data?.updated_at || null,
  };
}

function assertDataPayload(data, fallbackMessage) {
  if (!data?.error) return;
  throw new Error(buildReadableFunctionMessage(data, fallbackMessage));
}

export async function sendSignupOtp({
  phone,
  purpose = 'signup',
  firstName = '',
  lastName = '',
  password = '',
  referralCode = '',
}) {
  const { data, error } = await supabase.functions.invoke('send-signup-otp', {
    body: { phone, purpose, firstName, lastName, password, referralCode },
  });

  await assertFunctionResult(error, 'OTP yuborishda xato yuz berdi.');
  assertDataPayload(data, 'OTP yuborishda xato yuz berdi.');
  return mapOtpResponse(data, phone, purpose, 'OTP yuborildi');
}

export async function sendResetPasswordOtp({ phone }) {
  const { data, error } = await supabase.functions.invoke('send-signup-otp', {
    body: { phone, purpose: 'reset_password' },
  });

  await assertFunctionResult(error, 'Parol tiklash kodi yuborishda xato yuz berdi.');
  assertDataPayload(data, 'Parol tiklash kodi yuborishda xato yuz berdi.');
  return mapOtpResponse(data, phone, 'reset_password', 'Tiklash kodi yuborildi');
}

export async function verifySignupOtp({ phone, otp, purpose = 'signup' }) {
  const { data, error } = await supabase.functions.invoke('verify-signup-otp', {
    body: { phone, otp, code: otp, purpose },
  });

  await assertFunctionResult(error, 'OTP tasdiqlashda xato yuz berdi.');
  assertDataPayload(data, 'OTP tasdiqlashda xato yuz berdi.');
  return mapOtpResponse(data, phone, purpose, 'Telefon muvaffaqiyatli tasdiqlandi');
}

export async function resetPasswordWithOtp({ phone, otp, newPassword }) {
  const { data, error } = await supabase.functions.invoke('reset-password-with-otp', {
    body: { phone, otp, code: otp, newPassword, new_password: newPassword },
  });

  await assertFunctionResult(error, 'Parolni tiklashda xato yuz berdi.');
  assertDataPayload(data, 'Parolni tiklashda xato yuz berdi.');
  return mapOtpResponse(data, phone, 'reset_password', 'Parol muvaffaqiyatli yangilandi');
}

export default {
  sendSignupOtp,
  sendResetPasswordOtp,
  verifySignupOtp,
  resetPasswordWithOtp,
};
