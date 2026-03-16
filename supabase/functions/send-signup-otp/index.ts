import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
interface JsonObject { [key: string]: JsonValue; }

interface SendOtpRequest {
  phone?: string;
  purpose?: 'signup' | 'reset_password' | string;
  firstName?: string;
  lastName?: string;
  password?: string;
  referralCode?: string | null;
}

interface AccountLookupRow {
  exists_account: boolean;
  profile_id: string | null;
  auth_user_id: string | null;
  matched_phone: string | null;
}

interface PendingOtpRow {
  id: string;
  resend_count: number;
  last_sent_at: string | null;
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
  auth: { persistSession: false, autoRefreshToken: false },
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
    headers: { ...corsHeaders(), 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function normalizePhone(input: string): string {
  const digitsOnly = input.replace(/\D/g, '');
  if (digitsOnly.length === 12 && digitsOnly.startsWith('998')) return `+${digitsOnly}`;
  if (digitsOnly.length === 9) return `+998${digitsOnly}`;
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

async function lookupAccountByPhone(normalizedPhone: string): Promise<AccountLookupRow | null> {
  const { data, error } = await supabaseAdmin.rpc('lookup_account_by_phone', { input_phone: normalizedPhone });
  if (error) throw new Error(`lookup_account_by_phone RPC failed: ${error.message}`);
  const rows = Array.isArray(data) ? (data as AccountLookupRow[]) : [];
  return rows[0] ?? null;
}

async function sendSmsViaTelerivet(phone: string, message: string): Promise<void> {
  if (!TELERIVET_API_KEY || !TELERIVET_PROJECT_ID || !TELERIVET_ROUTE_ID) {
    return;
  }
  const form = new URLSearchParams();
  form.set('content', message);
  form.set('to_number', phone);
  form.set('route_id', TELERIVET_ROUTE_ID);
  const response = await fetch(`https://api.telerivet.com/v1/projects/${TELERIVET_PROJECT_ID}/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${TELERIVET_API_KEY}:`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Telerivet SMS send failed: ${response.status} ${text}`);
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });
  if (request.method !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });

  try {
    const body = await request.json() as SendOtpRequest;
    const rawPhone = String(body.phone ?? '').trim();
    const purpose = body.purpose === 'reset_password' ? 'reset_password' : 'signup';
    if (!rawPhone) return jsonResponse(400, { error: 'Telefon raqamini kiriting' });

    const normalizedPhone = normalizePhone(rawPhone);
    const account = await lookupAccountByPhone(normalizedPhone);
    const existsAccount = !!account?.exists_account;

    if (purpose === 'signup' && existsAccount) {
      return jsonResponse(409, { error: 'Siz bu raqam bilan ro‘yxatdan o‘tgansiz. Iltimos, login qiling.' });
    }
    if (purpose === 'reset_password' && !existsAccount) {
      return jsonResponse(404, { error: 'Bu telefon raqamiga bog‘langan akkaunt topilmadi.' });
    }

    const { data: pendingData, error: pendingError } = await supabaseAdmin.rpc('otp_get_pending', {
      p_phone_e164: normalizedPhone,
      p_purpose: purpose,
    });
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

    const pendingRows = Array.isArray(pendingData) ? pendingData as PendingOtpRow[] : [];
    const pending = pendingRows[0] ?? null;

    if (pending?.last_sent_at) {
      const retryAt = new Date(new Date(pending.last_sent_at).getTime() + RESEND_COOLDOWN_SECONDS * 1000).getTime();
      if (retryAt > Date.now()) {
        return jsonResponse(429, {
          error: 'OTP qayta yuborish uchun kuting',
          retry_after_seconds: Math.ceil((retryAt - Date.now()) / 1000),
        });
      }
    }
    if (pending && Number(pending.resend_count ?? 0) >= MAX_RESEND_COUNT) {
      return jsonResponse(429, { error: 'OTP yuborish limiti tugadi. Keyinroq urinib ko‘ring.' });
    }

    const otpCode = generateOtpCode();
    const otpHash = await hashOtp(normalizedPhone, purpose, otpCode);
    const nowIso = new Date().toISOString();
    const expiresAtIso = new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString();
    const metadata = {
      first_name: body.firstName ?? null,
      last_name: body.lastName ?? null,
      password: body.password ?? null,
      referral_code: body.referralCode ?? null,
    };

    if (pending?.id) {
      const { error: refreshError } = await supabaseAdmin.rpc('otp_refresh_pending', {
        p_id: pending.id,
        p_otp_hash: otpHash,
        p_otp_code: otpCode,
        p_expires_at: expiresAtIso,
        p_last_sent_at: nowIso,
        p_resend_count: Number(pending.resend_count ?? 0) + 1,
        p_metadata: metadata,
      });
      if (refreshError) {
        return jsonResponse(500, {
          error: 'OTP yozishda xato',
          debug_step: 'update_pending_otp',
          code: refreshError.code ?? null,
          details: refreshError.message,
          hint: refreshError.hint ?? null,
        });
      }
    } else {
      const { error: insertError } = await supabaseAdmin.rpc('otp_create_pending', {
        p_phone: rawPhone.replace(/\D/g, ''),
        p_phone_e164: normalizedPhone,
        p_purpose: purpose,
        p_otp_hash: otpHash,
        p_otp_code: otpCode,
        p_expires_at: expiresAtIso,
        p_last_sent_at: nowIso,
        p_metadata: metadata,
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

    await sendSmsViaTelerivet(normalizedPhone, `UniGo tasdiqlash kodingiz: ${otpCode}. Kod ${Math.floor(OTP_TTL_SECONDS / 60)} daqiqa amal qiladi.`);

    return jsonResponse(200, {
      success: true,
      message: 'SMS kod yuborildi',
      phone: normalizedPhone,
      purpose,
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
