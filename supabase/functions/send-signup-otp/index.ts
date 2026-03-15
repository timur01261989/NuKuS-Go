import { createClient } from 'npm:@supabase/supabase-js@2';

interface SendSignupOtpPayload {
  phone?: string;
  purpose?: 'signup' | 'reset_password' | string;
}

interface PendingOtpRow {
  id: string;
  resend_count: number | null;
  last_sent_at: string | null;
}

interface ProfileLookupRow {
  profile_exists: boolean;
  profile_id: string | null;
  phone: string | null;
  phone_normalized: string | null;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const TELERIVET_API_KEY = Deno.env.get('TELERIVET_API_KEY') ?? '';
const TELERIVET_PROJECT_ID = Deno.env.get('TELERIVET_PROJECT_ID') ?? '';
const TELERIVET_ROUTE_ID = Deno.env.get('TELERIVET_ROUTE_ID') ?? '';
const OTP_PEPPER = Deno.env.get('OTP_PEPPER') ?? '';

const OTP_TTL_SECONDS = 180;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_RESEND_COUNT = 3;
const OTP_LENGTH = 6;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase reserved environment variables');
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
    'Content-Type': 'application/json',
  };
}

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: corsHeaders(),
  });
}

function normalizeUzPhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');

  if (digits.length === 9) {
    return `+998${digits}`;
  }

  if (digits.length === 12 && digits.startsWith('998')) {
    return `+${digits}`;
  }

  if (digits.length === 13 && digits.startsWith('998')) {
    return `+${digits}`;
  }

  if (rawPhone.startsWith('+') && rawPhone.replace(/\D/g, '').length === 12) {
    return rawPhone;
  }

  throw new Error('Telefon raqami noto‘g‘ri formatda');
}

async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function generateOtpCode(): string {
  const value = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return value.toString().padStart(OTP_LENGTH, '0');
}

async function lookupProfileByPhone(phoneE164: string): Promise<ProfileLookupRow> {
  const normalizedDigits = phoneE164.replace(/\D/g, '');

  const { data, error } = await supabaseAdmin.rpc('lookup_profile_by_phone', {
    input_phone: phoneE164,
    input_phone_normalized: normalizedDigits,
  });

  if (error) {
    throw new Error(`lookup_profile_by_phone RPC failed: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    profile_exists: Boolean(row?.profile_exists),
    profile_id: row?.profile_id ?? null,
    phone: row?.phone ?? null,
    phone_normalized: row?.phone_normalized ?? null,
  };
}

async function sendSmsViaTelerivet(phone: string, message: string): Promise<void> {
  if (!TELERIVET_API_KEY || !TELERIVET_PROJECT_ID || !TELERIVET_ROUTE_ID) {
    throw new Error('Missing Telerivet environment variables');
  }

  const endpoint = `https://api.telerivet.com/v1/projects/${TELERIVET_PROJECT_ID}/messages/send`;
  const formData = new URLSearchParams();
  formData.set('content', message);
  formData.set('to_number', phone);
  formData.set('route_id', TELERIVET_ROUTE_ID);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${TELERIVET_API_KEY}:`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`Telerivet send failed: HTTP ${response.status} - ${responseText}`);
  }
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() });
  }

  if (request.method !== 'POST') {
    return jsonResponse(405, {
      error: 'Method not allowed',
      debug_step: 'method_guard',
    });
  }

  try {
    const payload = (await request.json()) as SendSignupOtpPayload;
    const phone = normalizeUzPhone(payload.phone ?? '');
    const purpose = payload.purpose === 'reset_password' ? 'reset_password' : 'signup';

    const profile = await lookupProfileByPhone(phone);

    if (purpose === 'signup' && profile.profile_exists) {
      return jsonResponse(409, {
        error: 'Bu telefon raqam bilan allaqachon ro‘yxatdan o‘tilgan. Iltimos, login qiling.',
        debug_step: 'signup_profile_exists',
        profile,
      });
    }

    if (purpose === 'reset_password' && !profile.profile_exists) {
      return jsonResponse(404, {
        error: 'Bu telefon raqamiga bog‘langan akkaunt topilmadi.',
        debug_step: 'reset_profile_missing',
        profile,
      });
    }

    const { data: pendingRows, error: pendingError } = await supabaseAdmin
      .from('phone_otp_verifications')
      .select('id, resend_count, last_sent_at')
      .eq('phone_e164', phone)
      .eq('purpose', purpose)
      .eq('status', 'pending')
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (pendingError) {
      return jsonResponse(500, {
        error: 'OTP holatini tekshirishda xato',
        debug_step: 'select_pending_otp',
        details: pendingError.message,
        code: pendingError.code ?? null,
        hint: pendingError.hint ?? null,
        phone,
        purpose,
      });
    }

    const pending = ((pendingRows ?? [])[0] as PendingOtpRow | undefined) ?? null;

    if (pending) {
      const resendCount = pending.resend_count ?? 0;
      const cooldownEndsAt = pending.last_sent_at
        ? new Date(new Date(pending.last_sent_at).getTime() + RESEND_COOLDOWN_SECONDS * 1000)
        : null;

      if (cooldownEndsAt && cooldownEndsAt.getTime() > Date.now()) {
        return jsonResponse(429, {
          error: 'OTP qayta yuborish uchun kuting',
          debug_step: 'otp_cooldown',
          retry_after_seconds: Math.ceil((cooldownEndsAt.getTime() - Date.now()) / 1000),
          pending,
        });
      }

      if (resendCount >= MAX_RESEND_COUNT) {
        return jsonResponse(429, {
          error: 'OTP yuborish limiti tugagan. Birozdan keyin qayta urinib ko‘ring.',
          debug_step: 'otp_resend_limit',
          pending,
        });
      }

      const { error: cancelError } = await supabaseAdmin
        .from('phone_otp_verifications')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', pending.id);

      if (cancelError) {
        return jsonResponse(500, {
          error: 'Eski OTP yozuvini bekor qilishda xato',
          debug_step: 'cancel_pending_otp',
          details: cancelError.message,
          code: cancelError.code ?? null,
          hint: cancelError.hint ?? null,
          pending,
        });
      }
    }

    if (!OTP_PEPPER) {
      return jsonResponse(500, {
        error: 'OTP_PEPPER topilmadi',
        debug_step: 'otp_pepper_missing',
      });
    }

    const otpCode = generateOtpCode();
    const otpHash = await sha256Hex(`${phone}:${purpose}:${otpCode}:${OTP_PEPPER}`);
    const nowIso = new Date().toISOString();
    const expiresAtIso = new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString();

    const { data: insertedOtp, error: insertError } = await supabaseAdmin
      .from('phone_otp_verifications')
      .insert({
        phone,
        phone_e164: phone,
        purpose,
        otp_hash: otpHash,
        status: 'pending',
        resend_count: pending ? (pending.resend_count ?? 0) + 1 : 0,
        attempt_count: 0,
        last_sent_at: nowIso,
        expires_at: expiresAtIso,
        verified_at: null,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select('id, phone_e164, purpose, expires_at, resend_count, last_sent_at')
      .single();

    if (insertError) {
      return jsonResponse(500, {
        error: 'OTP yozuvini saqlashda xato',
        debug_step: 'insert_otp',
        details: insertError.message,
        code: insertError.code ?? null,
        hint: insertError.hint ?? null,
        phone,
        purpose,
      });
    }

    const smsText = purpose === 'reset_password'
      ? `UniGo parolni tiklash kodi: ${otpCode}. Kod ${OTP_TTL_SECONDS / 60} daqiqa ichida amal qiladi.`
      : `UniGo tasdiqlash kodi: ${otpCode}. Kod ${OTP_TTL_SECONDS / 60} daqiqa ichida amal qiladi.`;

    try {
      await sendSmsViaTelerivet(phone, smsText);
    } catch (smsError) {
      await supabaseAdmin
        .from('phone_otp_verifications')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', insertedOtp.id);

      return jsonResponse(500, {
        error: 'SMS yuborishda xato',
        debug_step: 'send_sms',
        details: smsError instanceof Error ? smsError.message : String(smsError),
        phone,
        purpose,
        otp_record: insertedOtp,
      });
    }

    return jsonResponse(200, {
      success: true,
      message: 'OTP yuborildi',
      debug_step: 'success',
      data: {
        phone: insertedOtp.phone_e164,
        purpose: insertedOtp.purpose,
        expires_at: insertedOtp.expires_at,
        resend_count: insertedOtp.resend_count,
        last_sent_at: insertedOtp.last_sent_at,
      },
    });
  } catch (error) {
    return jsonResponse(500, {
      error: 'UNCAUGHT_DEBUG',
      debug_step: 'top_level_catch',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });
  }
});
