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

function mapOtpResult(data, fallbackPhone, fallbackPurpose, fallbackMessage) {
  return {
    success: !!data?.success,
    phone: data?.phone || fallbackPhone,
    purpose: data?.purpose || fallbackPurpose,
    expiresInSeconds: Number(data?.expires_in_seconds || 180),
    resendCooldownSeconds: Number(data?.resend_cooldown_seconds || 60),
    retryAfterSeconds: Number(data?.retry_after_seconds || 0),
    verifiedAt: data?.verified_at || null,
    message: data?.message || fallbackMessage,
  };
}

async function invokeOtpSender({ phone, purpose }) {
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

  return mapOtpResult(data, phone, purpose, 'OTP yuborildi');
}

async function invokeOtpVerifier({ phone, otp, purpose, userId = null }) {
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

  return mapOtpResult(data, phone, purpose, 'Telefon muvaffaqiyatli tasdiqlandi');
}

export async function sendSignupOtp({ phone, purpose = 'signup' }) {
  return invokeOtpSender({ phone, purpose });
}

export async function verifySignupOtp({ phone, otp, purpose = 'signup', userId = null }) {
  return invokeOtpVerifier({ phone, otp, purpose, userId });
}

export async function sendPasswordResetOtp({ phone }) {
  return invokeOtpSender({ phone, purpose: 'reset_password' });
}

export async function verifyPasswordResetOtp({ phone, otp }) {
  return invokeOtpVerifier({ phone, otp, purpose: 'reset_password', userId: null });
}

export async function resetPasswordWithOtp({ phone, newPassword }) {
  const { data, error } = await supabase.functions.invoke('reset-password-with-otp', {
    body: {
      phone,
      new_password: newPassword,
    },
  });

  assertFunctionResult(error, 'Parolni yangilashda xato yuz berdi.');

  if (data?.error) {
    throw new Error(String(data.error));
  }

  return {
    success: !!data?.success,
    phone: data?.phone || phone,
    resetCompletedAt: data?.reset_completed_at || null,
    message: data?.message || 'Parol muvaffaqiyatli yangilandi.',
  };
}

export default {
  sendSignupOtp,
  verifySignupOtp,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPasswordWithOtp,
};
