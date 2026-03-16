import { supabase } from '@/services/supabase/supabaseClient';

async function extractFunctionError(error, fallbackMessage) {
  if (!error) {
    return null;
  }

  const context = error?.context;

  if (context && typeof context === 'object' && typeof context.text === 'function') {
    try {
      const rawText = await context.text();
      if (rawText) {
        try {
          const parsed = JSON.parse(rawText);
          if (parsed?.error) return String(parsed.error);
          if (parsed?.message) return String(parsed.message);
          if (parsed?.details) return String(parsed.details);
        } catch {
          return String(rawText);
        }
      }
    } catch {
      // ignore and fall through
    }
  }

  const details =
    error?.context?.error ||
    error?.context?.details ||
    error?.message ||
    fallbackMessage;

  return String(details || fallbackMessage);
}

async function assertFunctionResult(error, fallbackMessage) {
  if (!error) {
    return;
  }

  const message = await extractFunctionError(error, fallbackMessage);
  throw new Error(message);
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
  };
}

export async function sendSignupOtp({ phone, purpose = 'signup', firstName = '', lastName = '', password = '', referralCode = null }) {
  const { data, error } = await supabase.functions.invoke('send-signup-otp', {
    body: {
      phone,
      purpose,
      firstName,
      lastName,
      password,
      referralCode,
    },
  });

  await assertFunctionResult(error, 'OTP yuborishda xato yuz berdi.');

  if (data?.error) {
    throw new Error(String(data.error));
  }

  return mapOtpResponse(data, phone, purpose, 'OTP yuborildi');
}

export async function sendResetPasswordOtp({ phone }) {
  const { data, error } = await supabase.functions.invoke('send-signup-otp', {
    body: {
      phone,
      purpose: 'reset_password',
    },
  });

  await assertFunctionResult(error, 'Parol tiklash kodi yuborishda xato yuz berdi.');

  if (data?.error) {
    throw new Error(String(data.error));
  }

  return mapOtpResponse(data, phone, 'reset_password', 'Tiklash kodi yuborildi');
}

export async function verifySignupOtp({ phone, otp, purpose = 'signup', userId = null, firstName = '', lastName = '', password = '', referralCode = null }) {
  const { data, error } = await supabase.functions.invoke('verify-signup-otp', {
    body: {
      phone,
      code: otp,
      otp,
      purpose,
      user_id: userId,
      firstName,
      lastName,
      password,
      referralCode,
    },
  });

  await assertFunctionResult(error, 'OTP tasdiqlashda xato yuz berdi.');

  if (data?.error) {
    throw new Error(String(data.error));
  }

  return {
    success: !!data?.success,
    phone: data?.phone || phone,
    purpose: data?.purpose || purpose,
    verifiedAt: data?.verified_at || null,
    message: data?.message || 'Telefon muvaffaqiyatli tasdiqlandi',
    userId: data?.user_id || null,
    userCreated: !!data?.user_created,
  };
}

export async function resetPasswordWithOtp({ phone, otp, newPassword }) {
  const { data, error } = await supabase.functions.invoke('reset-password-with-otp', {
    body: {
      phone,
      otp,
      newPassword,
    },
  });

  await assertFunctionResult(error, 'Parolni tiklashda xato yuz berdi.');

  if (data?.error) {
    throw new Error(String(data.error));
  }

  return {
    success: !!data?.success,
    phone: data?.phone || phone,
    message: data?.message || 'Parol muvaffaqiyatli yangilandi',
  };
}
