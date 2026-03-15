import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

type JsonRecord = Record<string, unknown>;

type VerifySignupRequest = {
  phone?: string;
  otp?: string;
  code?: string;
  password?: string;
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  referral_code?: string;
  referralCode?: string;
};

type LookupResponse = {
  exists_profile: boolean;
  profile_id: string | null;
  auth_user_id: string | null;
  matched_phone: string | null;
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const OTP_PEPPER = Deno.env.get('OTP_PEPPER') ?? '';
const OTP_MAX_ATTEMPTS = 5;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OTP_PEPPER) {
  throw new Error('Missing required environment variables.');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'unigo-phone-otp/verify-signup-otp',
    },
  },
});

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

function jsonResponse(status: number, payload: JsonRecord): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: corsHeaders(),
  });
}

function normalizePhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('998')) {
    return `+${digits}`;
  }
  if (digits.length === 9) {
    return `+998${digits}`;
  }
  if (rawPhone.startsWith('+') && /^\+\d{10,15}$/.test(rawPhone)) {
    return rawPhone;
  }
  throw new Error('Telefon raqami noto‘g‘ri formatda.');
}

function sanitizeName(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOtp(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error('SMS kod kiritilishi kerak.');
  }

  const code = String(value).replace(/\D/g, '');
  if (code.length !== 6) {
    throw new Error('SMS kod 6 raqamdan iborat bo‘lishi kerak.');
  }
  return code;
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashOtp(phoneE164: string, purpose: string, otpCode: string): Promise<string> {
  return sha256Hex(`${phoneE164}|${purpose}|${otpCode}|${OTP_PEPPER}`);
}

async function lookupRegistrationByPhone(phoneE164: string): Promise<LookupResponse> {
  const { data, error } = await supabaseAdmin.rpc('find_profile_by_phone_for_otp', {
    p_phone: phoneE164,
  });

  if (error) {
    throw new Error(`Telefon bo‘yicha profilni tekshirishda xato: ${error.message}`);
  }

  const row = Array.isArray(data) && data.length > 0 ? data[0] as Partial<LookupResponse> : null;

  return {
    exists_profile: Boolean(row?.exists_profile),
    profile_id: typeof row?.profile_id === 'string' ? row.profile_id : null,
    auth_user_id: typeof row?.auth_user_id === 'string' ? row.auth_user_id : null,
    matched_phone: typeof row?.matched_phone === 'string' ? row.matched_phone : null,
  };
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() });
  }

  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Faqat POST ruxsat etiladi.' });
  }

  try {
    const body = await request.json() as VerifySignupRequest;
    const phoneE164 = normalizePhone(typeof body.phone === 'string' ? body.phone.trim() : '');
    const otpCode = normalizeOtp(body.otp ?? body.code);
    const password = typeof body.password === 'string' ? body.password : '';
    const firstName = sanitizeName(body.first_name ?? body.firstName);
    const lastName = sanitizeName(body.last_name ?? body.lastName);
    const referralCode = sanitizeName(body.referral_code ?? body.referralCode);

    if (password.length < 6) {
      return jsonResponse(400, {
        error: 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak.',
      });
    }

    const existing = await lookupRegistrationByPhone(phoneE164);
    if (existing.exists_profile) {
      return jsonResponse(409, {
        error: 'Bu telefon raqam bilan allaqachon ro‘yxatdan o‘tilgan. Iltimos login qiling.',
        code: 'ALREADY_REGISTERED',
      });
    }

    const otpHash = await hashOtp(phoneE164, 'signup', otpCode);

    const { data: otpRows, error: otpError } = await supabaseAdmin
      .from('phone_otp_verifications')
      .select('id, attempt_count, expires_at, verified_at, status')
      .eq('phone_e164', phoneE164)
      .eq('purpose', 'signup')
      .eq('otp_hash', otpHash)
      .eq('status', 'pending')
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (otpError) {
      return jsonResponse(500, {
        error: 'OTP kodini tekshirishda xato',
        details: otpError.message,
      });
    }

    const otpRow = Array.isArray(otpRows) && otpRows.length > 0 ? otpRows[0] as {
      id: string;
      attempt_count: number | null;
      expires_at: string | null;
      verified_at: string | null;
      status: string;
    } : null;

    if (!otpRow) {
      return jsonResponse(400, {
        error: 'SMS kod noto‘g‘ri yoki eskirgan.',
        code: 'INVALID_OTP',
      });
    }

    if (otpRow.expires_at && new Date(otpRow.expires_at).getTime() < Date.now()) {
      await supabaseAdmin
        .from('phone_otp_verifications')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', otpRow.id);

      return jsonResponse(400, {
        error: 'SMS kod muddati tugagan. Yangi kod so‘rang.',
        code: 'OTP_EXPIRED',
      });
    }

    const nextAttemptCount = (otpRow.attempt_count ?? 0) + 1;
    if (nextAttemptCount > OTP_MAX_ATTEMPTS) {
      await supabaseAdmin
        .from('phone_otp_verifications')
        .update({ status: 'blocked', attempt_count: nextAttemptCount, updated_at: new Date().toISOString() })
        .eq('id', otpRow.id);

      return jsonResponse(429, {
        error: 'Juda ko‘p urinish qilindi. Yangi kod so‘rang.',
        code: 'TOO_MANY_ATTEMPTS',
      });
    }

    const { data: createdUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      phone: phoneE164,
      password,
      phone_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        referral_code: referralCode,
      },
      app_metadata: {
        provider: 'phone',
      },
    });

    if (createUserError || !createdUser.user) {
      return jsonResponse(500, {
        error: 'Foydalanuvchini yaratishda xato',
        details: createUserError?.message ?? 'Auth user yaratilmagan.',
      });
    }

    const { error: finalizeError } = await supabaseAdmin.rpc('upsert_profile_after_phone_signup', {
      p_user_id: createdUser.user.id,
      p_phone: phoneE164,
      p_first_name: firstName,
      p_last_name: lastName,
      p_referral_code: referralCode,
    });

    if (finalizeError) {
      await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id);
      return jsonResponse(500, {
        error: 'Profilni saqlashda xato',
        details: finalizeError.message,
      });
    }

    const { error: verifyOtpError } = await supabaseAdmin
      .from('phone_otp_verifications')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
        attempt_count: nextAttemptCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', otpRow.id);

    if (verifyOtpError) {
      return jsonResponse(500, {
        error: 'OTP yozuvini yakunlashda xato',
        details: verifyOtpError.message,
      });
    }

    return jsonResponse(200, {
      success: true,
      user_id: createdUser.user.id,
      phone: phoneE164,
      message: 'Ro‘yxatdan o‘tish muvaffaqiyatli yakunlandi.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Noma’lum xatolik yuz berdi.';
    return jsonResponse(500, { error: message });
  }
});
