import { supabase } from '@/services/supabase/supabaseClient';

function assertFunctionResult(error, fallbackMessage) {
  if (error) {
    const details =
      error?.context?.error ||
      error?.context?.details ||
      error?.message ||
      fallbackMessage;
    throw new Error(String(details || fallbackMessage));
  }
}

export async function sendSignupOtp({ phone, purpose = 'signup' }) {
  const { data, error } = await supabase.functions.invoke('send-signup-otp', {
    body: {
      phone,
      purpose,
    },
  });

  assertFunctionResult(error, 'OTP yuborishda xato yuz berdi.');

  if (data?.error) {
    throw new Error(String(data.error));
  }

  return {
    success: !!data?.success,
    phone: data?.phone || phone,
    purpose: data?.purpose || purpose,
    expiresInSeconds: Number(data?.expires_in_seconds || 180),
    resendCooldownSeconds: Number(data?.resend_cooldown_seconds || 60),
    retryAfterSeconds: Number(data?.retry_after_seconds || 0),
    message: data?.message || 'OTP yuborildi',
  };
}

export async function verifySignupOtp({ phone, otp, purpose = 'signup', userId = null }) {
  const { data, error } = await supabase.functions.invoke('verify-signup-otp', {
    body: {
      phone,
      otp,
      purpose,
      user_id: userId,
    },
  });

  assertFunctionResult(error, 'OTP tasdiqlashda xato yuz berdi.');

  if (data?.error) {
    throw new Error(String(data.error));
  }

  return {
    success: !!data?.success,
    phone: data?.phone || phone,
    purpose: data?.purpose || purpose,
    verifiedAt: data?.verified_at || null,
    message: data?.message || 'Telefon muvaffaqiyatli tasdiqlandi',
  };
}

export default {
  sendSignupOtp,
  verifySignupOtp,
};
