import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
interface JsonObject {
  [key: string]: JsonValue;
}

interface SendOtpRequest {
  phone?: string;
  purpose?: 'signup' | 'reset_password' | string;
  firstName?: string;
  lastName?: string;
  password?: string;
  referralCode?: string | null;
}

interface ProfileLookupRow {
  id: string;
  phone: string | null;
  phone_normalized: string | null;
}

interface PendingOtpRow {
  id: string;
  resend_count: number;
  last_sent_at: string | null;
}

interface TelerivetResponse {
  id?: string;
  status?: string;
  [key: string]: JsonValue;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const OTP_PEPPER = Deno.env.get('OTP_PEPPER') ?? '';
const TELERIVET_API_KEY = Deno.env.get('TELERIVET_API_KEY') ?? '';
const TELERIVET_PROJECT_ID = Deno.env.get('TELERIVET_PROJECT_ID') ?? '';
const TELERIVET_ROUTE_ID = Deno.env.get('TELERIVET_ROUTE_ID') ?? '';

const OTP_TTL_SECONDS = 180;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_RESEND_COUNT = 3;
const OTP_LENGTH = 6;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OTP_PEPPER) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OTP_PEPPER');
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

function jsonResponse(status: number, payload: JsonObject): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function normalizePhone(input: string): string {
  const digitsOnly = input.replace(/\D/g, '');
  if (digitsOnly.length === 12 && digitsOnly.startsWith('998')) {
    return `+${digitsOnly}`;
  }
  if (digitsOnly.length === 9) {
    return `+998${digitsOnly}`;
  }
  throw new Error('Telefon raqami noto‘g‘ri formatda. Masalan: +998901234567');
}

function generateOtpCode(): string {
  const random = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
  return String(random).padStart(OTP_LENGTH, '0');
}

async function hashOtp(phone: string, purpose: string, code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${OTP_PEPPER}|${phone}|${purpose}|${code}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function lookupProfileByPhone(rawPhone: string, normalizedPhone: string): Promise<ProfileLookupRow | null> {
  const { data, error } = await supabaseAdmin.rpc('lookup_profile_by_phone', {
    input_phone: rawPhone.replace(/\D/g, ''),
    input_phone_normalized: normalizedPhone,
  });

  if (error) {
    throw new Error(`lookup_profile_by_phone RPC failed: ${error.message}`);
  }

  const rows = Array.isArray(data) ? (data as ProfileLookupRow[]) : [];
  return rows[0] ?? null;
}

async function sendSmsViaTelerivet(phone: string, message: string): Promise<TelerivetResponse | null> {
  if (!TELERIVET_API_KEY || !TELERIVET_PROJECT_ID || !TELERIVET_ROUTE_ID) {
    return null;
  }

  const form = new URLSearchParams();
  form.set('content', message);
  form.set('to_number', phone);
  form.set('route_id', TELERIVET_ROUTE_ID);

  const response = await fetch(
    `https://api.telerivet.com/v1/projects/${TELERIVET_PROJECT_ID}/messages/send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${TELERIVET_API_KEY}:`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    },
  );

  const text = await response.text();
  let parsed: TelerivetResponse | null = null;

  try {
    parsed = text ? JSON.parse(text) as TelerivetResponse : null;
  } catch {
    parsed = { status: response.statusText, raw: text };
  }

  if (!response.ok) {
    throw new Error(`Telerivet SMS send failed: ${response.status} ${text}`);
  }

  return parsed;
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() });
  }

  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const body = await request.json() as SendOtpRequest;

    const rawPhone = body.phone?.trim() ?? '';
    const purpose = body.purpose === 'reset_password' ? 'reset_password' : 'signup';

    if (!rawPhone) {
      return jsonResponse(400, { error: 'Telefon raqamini kiriting' });
    }

    const normalizedPhone = normalizePhone(rawPhone);

    const existingProfile = await lookupProfileByPhone(rawPhone, normalizedPhone);

    if (purpose === 'signup' && existingProfile) {
      return jsonResponse(409, {
        error: 'Siz bu raqam bilan ro‘yxatdan o‘tgansiz. Iltimos, login qiling.',
      });
    }

    if (purpose === 'reset_password' && !existingProfile) {
      return jsonResponse(404, {
        error: 'Bu telefon raqamiga bog‘langan akkaunt topilmadi.',
      });
    }

    const { data: pendingRows, error: pendingError } = await supabaseAdmin
      .from('phone_otp_verifications')
      .select('id, resend_count, last_sent_at')
      .eq('phone_e164', normalizedPhone)
      .eq('purpose', purpose)
      .eq('status', 'pending')
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (pendingError) {
      return jsonResponse(500, {
        error: 'OTP holatini tekshirishda xato',
        debug_step: 'select_pending_otp',
        code: pendingError.code ?? null,
        details: pendingError.message,
        hint: pendingError.hint ?? null,
        phone: normalizedPhone,
        purpose,
      });
    }

    const pending = ((pendingRows ?? [])[0] as PendingOtpRow | undefined) ?? null;

    if (pending?.last_sent_at) {
      const cooldownUntil = new Date(new Date(pending.last_sent_at).getTime() + RESEND_COOLDOWN_SECONDS * 1000);
      if (cooldownUntil.getTime() > Date.now()) {
        return jsonResponse(429, {
          error: 'OTP qayta yuborish uchun kuting',
          retry_after_seconds: Math.ceil((cooldownUntil.getTime() - Date.now()) / 1000),
        });
      }
    }

    if (pending && pending.resend_count >= MAX_RESEND_COUNT) {
      return jsonResponse(429, {
        error: 'OTP yuborish limiti tugadi. Keyinroq urinib ko‘ring.',
      });
    }

    const otpCode = generateOtpCode();
    const otpHash = await hashOtp(normalizedPhone, purpose, otpCode);
    const nowIso = new Date().toISOString();
    const expiresAtIso = new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString();

    if (pending) {
      const { error: updateError } = await supabaseAdmin
        .from('phone_otp_verifications')
        .update({
          otp_hash: otpHash,
          otp_code: otpCode,
          expires_at: expiresAtIso,
          last_sent_at: nowIso,
          resend_count: pending.resend_count + 1,
          attempt_count: 0,
          updated_at: nowIso,
        })
        .eq('id', pending.id);

      if (updateError) {
        return jsonResponse(500, {
          error: 'OTP yozishda xato',
          debug_step: 'update_pending_otp',
          code: updateError.code ?? null,
          details: updateError.message,
          hint: updateError.hint ?? null,
        });
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('phone_otp_verifications')
        .insert({
          phone: rawPhone.replace(/\D/g, ''),
          phone_e164: normalizedPhone,
          purpose,
          otp_hash: otpHash,
          otp_code: otpCode,
          status: 'pending',
          resend_count: 0,
          attempt_count: 0,
          last_sent_at: nowIso,
          expires_at: expiresAtIso,
          metadata: {
            first_name: body.firstName ?? null,
            last_name: body.lastName ?? null,
            password: body.password ?? null,
            referral_code: body.referralCode ?? null,
          },
        });

      if (insertError) {
        return jsonResponse(500, {
          error: 'OTP saqlashda xato',
          debug_step: 'insert_pending_otp',
          code: insertError.code ?? null,
          details: insertError.message,
          hint: insertError.hint ?? null,
        });
      }
    }

    const smsText = `UniGo tasdiqlash kodingiz: ${otpCode}. Kod ${Math.floor(OTP_TTL_SECONDS / 60)} daqiqa amal qiladi.`;
    const smsResult = await sendSmsViaTelerivet(normalizedPhone, smsText);

    return jsonResponse(200, {
      success: true,
      message: 'SMS kod yuborildi',
      phone: normalizedPhone,
      purpose,
      sms_provider: smsResult ? 'telerivet' : 'skipped',
      expires_in_seconds: OTP_TTL_SECONDS,
      resend_cooldown_seconds: RESEND_COOLDOWN_SECONDS,
    });
  } catch (error) {
    return jsonResponse(500, {
      error: 'UNCAUGHT_DEBUG',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });
  }
});
