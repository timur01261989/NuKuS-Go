import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type JsonRecord = Record<string, unknown>;

interface VerifyOtpBody {
  phone: string;
  otp: string;
  purpose?: 'signup' | 'phone_change' | 'reset_password';
  user_id?: string | null;
}

interface OtpRow {
  id: string;
  phone_e164: string;
  purpose: string;
  otp_hash: string;
  expires_at: string;
  attempt_count: number;
  max_attempts: number;
  status: string;
  verified_at: string | null;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const OTP_PEPPER = Deno.env.get('OTP_PEPPER') ?? '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OTP_PEPPER) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
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
  const cleaned = String(rawPhone).replace(/[^\d+]/g, '');

  if (/^\+998\d{9}$/.test(cleaned)) {
    return cleaned;
  }

  if (/^998\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  if (/^\d{9}$/.test(cleaned)) {
    return `+998${cleaned}`;
  }

  throw new Error('Telefon raqam formati noto‘g‘ri. Masalan: +998901234567');
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashOtp(phone: string, purpose: string, otp: string): Promise<string> {
  return sha256Hex(`${phone}:${purpose}:${otp}:${OTP_PEPPER}`);
}

function validateOtpFormat(otp: string): string {
  const normalized = String(otp).trim();
  if (!/^\d{6}$/.test(normalized)) {
    throw new Error('OTP 6 xonali bo‘lishi kerak');
  }
  return normalized;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders(),
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const body = (await req.json()) as VerifyOtpBody;
    const phone = normalizeUzbekPhone(body.phone);
    const purpose = body.purpose ?? 'signup';
    const otp = validateOtpFormat(body.otp);
    const userId = body.user_id ?? null;

    const { data: otpRows, error: fetchError } = await supabase
      .from('phone_otp_verifications')
      .select('id, phone_e164, purpose, otp_hash, expires_at, attempt_count, max_attempts, status, verified_at')
      .eq('phone_e164', phone)
      .eq('purpose', purpose)
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

    const otpRow = (otpRows?.[0] as OtpRow | undefined) ?? null;

    if (!otpRow) {
      return jsonResponse(404, {
        error: 'Faol OTP topilmadi',
      });
    }

    if (new Date(otpRow.expires_at).getTime() < Date.now()) {
      const { error: expireError } = await supabase
        .from('phone_otp_verifications')
        .update({
          status: 'expired',
        })
        .eq('id', otpRow.id);

      if (expireError) {
        return jsonResponse(500, {
          error: 'OTP muddatini yangilashda xato',
          details: expireError.message,
        });
      }

      return jsonResponse(400, {
        error: 'OTP muddati tugagan',
      });
    }

    if (otpRow.attempt_count >= otpRow.max_attempts) {
      const { error: blockError } = await supabase
        .from('phone_otp_verifications')
        .update({
          status: 'blocked',
        })
        .eq('id', otpRow.id);

      if (blockError) {
        return jsonResponse(500, {
          error: 'OTP bloklashda xato',
          details: blockError.message,
        });
      }

      return jsonResponse(429, {
        error: 'OTP kiritish urinishlari tugagan',
      });
    }

    const submittedHash = await hashOtp(phone, purpose, otp);

    if (submittedHash !== otpRow.otp_hash) {
      const nextAttemptCount = otpRow.attempt_count + 1;
      const nextStatus = nextAttemptCount >= otpRow.max_attempts ? 'blocked' : 'pending';

      const { error: updateAttemptError } = await supabase
        .from('phone_otp_verifications')
        .update({
          attempt_count: nextAttemptCount,
          status: nextStatus,
        })
        .eq('id', otpRow.id);

      if (updateAttemptError) {
        return jsonResponse(500, {
          error: 'OTP urinishini yangilashda xato',
          details: updateAttemptError.message,
        });
      }

      return jsonResponse(400, {
        error: 'OTP noto‘g‘ri',
        attempts_left: Math.max(otpRow.max_attempts - nextAttemptCount, 0),
      });
    }

    const verifiedAt = new Date().toISOString();

    const { error: verifyError } = await supabase
      .from('phone_otp_verifications')
      .update({
        verified_at: verifiedAt,
        status: 'verified',
      })
      .eq('id', otpRow.id);

    if (verifyError) {
      return jsonResponse(500, {
        error: 'OTP ni verified qilishda xato',
        details: verifyError.message,
      });
    }

    if (userId) {
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          phone: phone,
          phone_verified: true,
          phone_verified_at: verifiedAt,
        })
        .eq('id', userId);

      if (profileUpdateError) {
        return jsonResponse(500, {
          error: 'Profile phone verificationni yangilashda xato',
          details: profileUpdateError.message,
        });
      }
    }

    return jsonResponse(200, {
      success: true,
      message: 'Telefon muvaffaqiyatli tasdiqlandi',
      phone,
      purpose,
      verified_at: verifiedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Noma’lum xato';
    return jsonResponse(400, {
      error: message,
    });
  }
});
