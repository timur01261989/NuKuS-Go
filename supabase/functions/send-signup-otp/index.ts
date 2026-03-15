import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

type JsonRecord = Record<string, unknown>;

type CorsHeaders = HeadersInit;

type PendingOtpRow = {
  id: string;
  resend_count: number | null;
  last_sent_at: string | null;
};

type LookupResponse = {
  exists_profile: boolean;
  profile_id: string | null;
  auth_user_id: string | null;
  matched_phone: string | null;
};

type SendOtpRequest = {
  phone?: string;
  purpose?: 'signup' | 'reset_password' | 'login' | string;
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const TELERIVET_API_KEY = Deno.env.get('TELERIVET_API_KEY') ?? '';
const TELERIVET_PROJECT_ID = Deno.env.get('TELERIVET_PROJECT_ID') ?? '';
const TELERIVET_ROUTE_ID = Deno.env.get('TELERIVET_ROUTE_ID') ?? '';
const OTP_PEPPER = Deno.env.get('OTP_PEPPER') ?? '';

const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 180;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_RESEND_COUNT = 3;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required Supabase environment variables.');
}

if (!TELERIVET_API_KEY || !TELERIVET_PROJECT_ID || !TELERIVET_ROUTE_ID || !OTP_PEPPER) {
  throw new Error('Missing required Telerivet or OTP environment variables.');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'unigo-phone-otp/send-signup-otp',
    },
  },
});

function corsHeaders(): CorsHeaders {
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

function normalizePurpose(rawPurpose: unknown): 'signup' | 'reset_password' | 'login' {
  if (rawPurpose === 'reset_password' || rawPurpose === 'login') {
    return rawPurpose;
  }
  return 'signup';
}

function generateOtpCode(): string {
  const randomBuffer = new Uint32Array(OTP_LENGTH);
  crypto.getRandomValues(randomBuffer);
  return Array.from(randomBuffer, (value) => (value % 10).toString()).join('');
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashOtp(phoneE164: string, purpose: string, otpCode: string): Promise<string> {
  return sha256Hex(`${phoneE164}|${purpose}|${otpCode}|${OTP_PEPPER}`);
}

async function sendTelerivetSms(phoneE164: string, message: string): Promise<{ id?: string; status?: string }> {
  const body = new URLSearchParams();
  body.set('to_number', phoneE164);
  body.set('content', message);
  body.set('route_id', TELERIVET_ROUTE_ID);
  body.set('message_type', 'sms');
  body.set('priority', '1');

  const authHeader = `Basic ${btoa(`${TELERIVET_API_KEY}:`)}`;
  const response = await fetch(`https://api.telerivet.com/v1/projects/${TELERIVET_PROJECT_ID}/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const responseText = await response.text();
  let payload: JsonRecord = {};

  try {
    payload = responseText ? JSON.parse(responseText) as JsonRecord : {};
  } catch {
    payload = { raw: responseText };
  }

  if (!response.ok) {
    throw new Error(`Telerivet SMS yuborishda xato: ${response.status} ${JSON.stringify(payload)}`);
  }

  return {
    id: typeof payload.id === 'string' ? payload.id : undefined,
    status: typeof payload.status === 'string' ? payload.status : undefined,
  };
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
    const body = await request.json() as SendOtpRequest;
    const rawPhone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const purpose = normalizePurpose(body.purpose);

    if (!rawPhone) {
      return jsonResponse(400, { error: 'Telefon raqami kiritilishi kerak.' });
    }

    const phoneE164 = normalizePhone(rawPhone);

    if (purpose === 'signup') {
      const registration = await lookupRegistrationByPhone(phoneE164);
      if (registration.exists_profile) {
        return jsonResponse(409, {
          error: 'Bu telefon raqam bilan allaqachon ro‘yxatdan o‘tilgan. Iltimos login qiling.',
          code: 'ALREADY_REGISTERED',
        });
      }
    }

    if (purpose === 'reset_password') {
      const registration = await lookupRegistrationByPhone(phoneE164);
      if (!registration.exists_profile) {
        return jsonResponse(404, {
          error: 'Bu telefon raqam bilan akkaunt topilmadi.',
          code: 'ACCOUNT_NOT_FOUND',
        });
      }
    }

    const { data: pendingRows, error: pendingError } = await supabaseAdmin
      .from('phone_otp_verifications')
      .select('id, resend_count, last_sent_at')
      .eq('phone_e164', phoneE164)
      .eq('purpose', purpose)
      .eq('status', 'pending')
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (pendingError) {
      return jsonResponse(500, {
        error: 'OTP holatini tekshirishda xato',
        details: pendingError.message,
      });
    }

    const pending = (Array.isArray(pendingRows) && pendingRows.length > 0 ? pendingRows[0] : null) as PendingOtpRow | null;

    if (pending?.last_sent_at) {
      const cooldownUntil = new Date(new Date(pending.last_sent_at).getTime() + RESEND_COOLDOWN_SECONDS * 1000);
      if (cooldownUntil.getTime() > Date.now()) {
        return jsonResponse(429, {
          error: 'OTP qayta yuborish uchun kuting.',
          retry_after_seconds: Math.ceil((cooldownUntil.getTime() - Date.now()) / 1000),
        });
      }
    }

    if (pending && (pending.resend_count ?? 0) >= MAX_RESEND_COUNT) {
      const { error: archiveError } = await supabaseAdmin
        .from('phone_otp_verifications')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('id', pending.id);

      if (archiveError) {
        return jsonResponse(500, {
          error: 'Eski OTP yozuvini yangilashda xato',
          details: archiveError.message,
        });
      }
    }

    const otpCode = generateOtpCode();
    const otpHash = await hashOtp(phoneE164, purpose, otpCode);
    const nowIso = new Date().toISOString();
    const expiresAtIso = new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString();

    if (pending && (pending.resend_count ?? 0) < MAX_RESEND_COUNT) {
      const { error: updateError } = await supabaseAdmin
        .from('phone_otp_verifications')
        .update({
          otp_hash: otpHash,
          otp_code: otpCode,
          status: 'pending',
          resend_count: (pending.resend_count ?? 0) + 1,
          attempt_count: 0,
          last_sent_at: nowIso,
          expires_at: expiresAtIso,
          updated_at: nowIso,
        })
        .eq('id', pending.id);

      if (updateError) {
        return jsonResponse(500, {
          error: 'OTP yozuvini yangilashda xato',
          details: updateError.message,
        });
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('phone_otp_verifications')
        .insert({
          phone: phoneE164,
          phone_e164: phoneE164,
          purpose,
          otp_hash: otpHash,
          otp_code: otpCode,
          status: 'pending',
          resend_count: 0,
          attempt_count: 0,
          last_sent_at: nowIso,
          expires_at: expiresAtIso,
          verified_at: null,
          created_at: nowIso,
          updated_at: nowIso,
        });

      if (insertError) {
        return jsonResponse(500, {
          error: 'OTP yozuvini saqlashda xato',
          details: insertError.message,
        });
      }
    }

    const smsText = purpose === 'reset_password'
      ? `UniGo parolni tiklash kodi: ${otpCode}. Kod ${Math.floor(OTP_TTL_SECONDS / 60)} daqiqa amal qiladi.`
      : `UniGo ro‘yxatdan o‘tish kodi: ${otpCode}. Kod ${Math.floor(OTP_TTL_SECONDS / 60)} daqiqa amal qiladi.`;

    const smsResult = await sendTelerivetSms(phoneE164, smsText);

    return jsonResponse(200, {
      success: true,
      phone: phoneE164,
      purpose,
      expires_in_seconds: OTP_TTL_SECONDS,
      resend_cooldown_seconds: RESEND_COOLDOWN_SECONDS,
      provider: 'telerivet',
      provider_message_id: smsResult.id ?? null,
      provider_status: smsResult.status ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Noma’lum xatolik yuz berdi.';
    return jsonResponse(500, {
      error: message,
    });
  }
});
