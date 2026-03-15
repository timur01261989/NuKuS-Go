import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type JsonRecord = Record<string, unknown>;

interface ResetPasswordBody {
  phone: string;
  otp: string;
  new_password: string;
}

interface OtpRow {
  id: string;
  otp_hash: string;
  expires_at: string;
  attempt_count: number;
  max_attempts: number;
}

interface ProfileLookupRow {
  id: string;
  phone: string | null;
  phone_normalized: string | null;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const OTP_PEPPER = Deno.env.get('OTP_PEPPER') ?? '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OTP_PEPPER) {
  throw new Error('Missing required environment variables');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function jsonResponse(status: number, body: JsonRecord): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function normalizeUzbekPhone(rawPhone: string): string {
  const cleaned = String(rawPhone || '').replace(/[^\d+]/g, '');
  if (/^\+998\d{9}$/.test(cleaned)) return cleaned;
  if (/^998\d{9}$/.test(cleaned)) return `+${cleaned}`;
  if (/^\d{9}$/.test(cleaned)) return `+998${cleaned}`;
  throw new Error('Telefon raqam formati noto‘g‘ri. Masalan: +998901234567');
}

function normalizePhoneForProfile(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.startsWith('998') ? `+${digits}` : phone;
}

function validateOtpFormat(otp: string): string {
  const normalized = String(otp || '').trim();
  if (!/^\d{6}$/.test(normalized)) {
    throw new Error('OTP 6 xonali bo‘lishi kerak');
  }
  return normalized;
}

function validatePassword(password: string): string {
  const normalized = String(password || '');
  if (normalized.length < 6) {
    throw new Error('Parol kamida 6 ta belgidan iborat bo‘lishi kerak.');
  }
  return normalized;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashOtp(phone: string, purpose: string, otp: string): Promise<string> {
  return sha256Hex(`${phone}:${purpose}:${otp}:${OTP_PEPPER}`);
}

async function findProfileByPhone(phone: string): Promise<ProfileLookupRow | null> {
  const normalized = normalizePhoneForProfile(phone);

  const { data, error } = await supabaseAdmin
    .rpc('find_profile_by_phone', { p_phone: normalized })
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Telefon bo'yicha profilni tekshirishda xato: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    id: String((data as JsonRecord).id ?? ''),
    phone: ((data as JsonRecord).phone as string | null) ?? null,
    phone_normalized: ((data as JsonRecord).phone_normalized as string | null) ?? null,
  };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const body = (await req.json()) as ResetPasswordBody;
    const phone = normalizeUzbekPhone(body.phone);
    const otp = validateOtpFormat(body.otp);
    const newPassword = validatePassword(body.new_password);

    const profile = await findProfileByPhone(phone);
    if (!profile?.id) {
      return jsonResponse(404, {
        error: 'Bu telefon raqam bilan foydalanuvchi topilmadi.',
      });
    }

    const { data: otpRows, error: fetchError } = await supabaseAdmin
      .from('phone_otp_verifications')
      .select('id, otp_hash, expires_at, attempt_count, max_attempts')
      .eq('phone_e164', phone)
      .eq('purpose', 'reset_password')
      .eq('status', 'pending')
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      return jsonResponse(500, {
        error: 'OTP ni o‘qishda xato',
        details: fetchError.message,
      });
    }

    const otpRow = ((otpRows?.[0] as OtpRow | undefined) ?? null);
    if (!otpRow) {
      return jsonResponse(404, {
        error: 'Faol tiklash kodi topilmadi.',
      });
    }

    if (new Date(otpRow.expires_at).getTime() < Date.now()) {
      await supabaseAdmin
        .from('phone_otp_verifications')
        .update({ status: 'expired' })
        .eq('id', otpRow.id);

      return jsonResponse(400, {
        error: 'Tiklash kodi muddati tugagan.',
      });
    }

    if (otpRow.attempt_count >= otpRow.max_attempts) {
      await supabaseAdmin
        .from('phone_otp_verifications')
        .update({ status: 'blocked' })
        .eq('id', otpRow.id);

      return jsonResponse(429, {
        error: 'Tiklash kodi urinishlari tugagan.',
      });
    }

    const submittedHash = await hashOtp(phone, 'reset_password', otp);
    if (submittedHash !== otpRow.otp_hash) {
      const nextAttemptCount = otpRow.attempt_count + 1;
      const nextStatus = nextAttemptCount >= otpRow.max_attempts ? 'blocked' : 'pending';

      await supabaseAdmin
        .from('phone_otp_verifications')
        .update({ attempt_count: nextAttemptCount, status: nextStatus })
        .eq('id', otpRow.id);

      return jsonResponse(400, {
        error: 'Tiklash kodi noto‘g‘ri.',
        attempts_left: Math.max(otpRow.max_attempts - nextAttemptCount, 0),
      });
    }

    const updatedAt = new Date().toISOString();

    const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
      password: newPassword,
    });

    if (updateUserError) {
      return jsonResponse(500, {
        error: 'Parolni yangilashda xato',
        details: updateUserError.message,
      });
    }

    const { error: verifyError } = await supabaseAdmin
      .from('phone_otp_verifications')
      .update({
        verified_at: updatedAt,
        status: 'verified',
      })
      .eq('id', otpRow.id);

    if (verifyError) {
      return jsonResponse(500, {
        error: 'OTP holatini yangilashda xato',
        details: verifyError.message,
      });
    }

    return jsonResponse(200, {
      success: true,
      phone,
      message: 'Parol muvaffaqiyatli yangilandi.',
      updated_at: updatedAt,
    });
  } catch (error) {
    return jsonResponse(400, {
      error: error instanceof Error ? error.message : 'Parolni tiklashda xato yuz berdi.',
    });
  }
});
