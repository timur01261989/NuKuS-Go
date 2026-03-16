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
const TELERIVET_PHONE_ID = Deno.env.get('TELERIVET_PHONE_ID') ?? '';
const SMS_MOCK_MODE = (Deno.env.get('SMS_MOCK_MODE') ?? 'false').toLowerCase() === 'true';

const OTP_EXPIRY_SECONDS = 180;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_RESENDS = 5;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

function jsonResponse(status: number, payload: JsonObject) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: corsHeaders(),
  });
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('998') && digits.length === 12) return `+${digits}`;
  if (digits.length === 9) return `+998${digits}`;
  if (digits.startsWith('+998') && digits.replace(/\D/g, '').length === 12) return value;
  throw new Error('Telefon raqami noto‘g‘ri formatda');
}

async function hashOtp(phone: string, purpose: string, otpCode: string) {
  const payload = `${phone}:${purpose}:${otpCode}:${OTP_PEPPER}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function lookupProfileByPhone(rawPhone: string, normalizedPhone: string) {
  const candidates = Array.from(new Set([rawPhone, normalizedPhone, normalizedPhone.replace('+', '')].filter(Boolean)));

  for (const candidate of candidates) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id, phone, phone_normalized')
      .or(`phone.eq.${candidate},phone_normalized.eq.${candidate}`)
      .limit(1);

    const row = ((data ?? [])[0] as ProfileLookupRow | undefined) ?? null;
    if (row) return row;
  }

  return null;
}

async function sendSms(phone: string, message: string) {
  if (SMS_MOCK_MODE) {
    console.info('SMS_MOCK_MODE enabled', { phone, message });
    return { id: 'mock-sms', status: 'mocked' } as TelerivetResponse;
  }

  const response = await fetch('https://api.telerivet.com/v1/projects/' + TELERIVET_PROJECT_ID + '/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${TELERIVET_API_KEY}:`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      content: message,
      to_number: phone,
      phone_id: TELERIVET_PHONE_ID,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SMS yuborilmadi (${response.status}): ${text}`);
  }

  return await response.json() as TelerivetResponse;
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
      return jsonResponse(400, { error: 'Telefon raqami kerak', code: 'PHONE_REQUIRED' });
    }

    const normalizedPhone = normalizePhone(rawPhone);
    const existingProfile = await lookupProfileByPhone(rawPhone, normalizedPhone);

    if (purpose === 'signup' && existingProfile) {
      return jsonResponse(409, { error: 'Bu raqam allaqachon ro‘yxatdan o‘tgan', code: 'PHONE_ALREADY_EXISTS' });
    }

    const { data: existingRows } = await supabaseAdmin
      .from('phone_otp_verifications')
      .select('id, resend_count, last_sent_at')
      .eq('phone_e164', normalizedPhone)
      .eq('purpose', purpose)
      .eq('status', 'pending')
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    const existingOtp = ((existingRows ?? [])[0] as PendingOtpRow | undefined) ?? null;
    const now = Date.now();

    if (existingOtp?.last_sent_at) {
      const lastSentMs = new Date(existingOtp.last_sent_at).getTime();
      const cooldownLeft = Math.max(0, RESEND_COOLDOWN_SECONDS - Math.floor((now - lastSentMs) / 1000));
      if (cooldownLeft > 0) {
        return jsonResponse(429, {
          error: 'Kod yaqinda yuborilgan. Biroz kuting.',
          code: 'OTP_COOLDOWN',
          retry_after_seconds: cooldownLeft,
        });
      }
      if ((existingOtp.resend_count ?? 0) >= MAX_RESENDS) {
        return jsonResponse(429, { error: 'Qayta yuborish limiti tugadi', code: 'OTP_RESEND_LIMIT' });
      }
    }

    const otpCode = generateOtpCode();
    const otpHash = await hashOtp(normalizedPhone, purpose, otpCode);
    const nowIso = new Date().toISOString();
    const expiresAt = new Date(now + OTP_EXPIRY_SECONDS * 1000).toISOString();

    const metadata = {
      first_name: body.firstName?.trim() || null,
      last_name: body.lastName?.trim() || null,
      password: body.password?.trim() || null,
      referral_code: body.referralCode?.trim() || null,
    };

    if (existingOtp) {
      const { error: updateError } = await supabaseAdmin
        .from('phone_otp_verifications')
        .update({
          otp_hash: otpHash,
          expires_at: expiresAt,
          resend_count: (existingOtp.resend_count ?? 0) + 1,
          last_sent_at: nowIso,
          updated_at: nowIso,
          metadata,
        })
        .eq('id', existingOtp.id);

      if (updateError) {
        return jsonResponse(500, { error: 'OTP saqlashda xato', code: 'OTP_SAVE_FAILED' });
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('phone_otp_verifications')
        .insert({
          phone: rawPhone,
          phone_e164: normalizedPhone,
          purpose,
          otp_hash: otpHash,
          expires_at: expiresAt,
          resend_count: 0,
          attempt_count: 0,
          status: 'pending',
          last_sent_at: nowIso,
          metadata,
          created_at: nowIso,
          updated_at: nowIso,
        });

      if (insertError) {
        return jsonResponse(500, { error: 'OTP yozishda xato', code: 'OTP_INSERT_FAILED' });
      }
    }

    const smsText = purpose === 'reset_password'
      ? `UniGo parol tiklash kodingiz: ${otpCode}`
      : `UniGo tasdiqlash kodingiz: ${otpCode}`;

    await sendSms(normalizedPhone, smsText);

    return jsonResponse(200, {
      success: true,
      phone: normalizedPhone,
      purpose,
      message: 'OTP yuborildi',
      expires_in_seconds: OTP_EXPIRY_SECONDS,
      resend_cooldown_seconds: RESEND_COOLDOWN_SECONDS,
      retry_after_seconds: 0,
    });
  } catch (error) {
    console.error('send-signup-otp failed', error);
    return jsonResponse(500, {
      error: 'OTP yuborishda xato yuz berdi',
      code: 'OTP_SEND_FAILED',
    });
  }
});
