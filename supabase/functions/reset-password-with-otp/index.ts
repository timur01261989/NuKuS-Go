import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
interface JsonObject {
  [key: string]: JsonValue;
}

interface ResetPasswordRequest {
  phone?: string;
  code?: string;
  newPassword?: string;
}

interface PendingOtpRow {
  id: string;
  phone_e164: string;
  otp_hash: string | null;
  otp_code: string | null;
  expires_at: string | null;
  attempt_count: number;
}

interface ProfileLookupRow {
  id: string;
  phone: string | null;
  phone_normalized: string | null;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const OTP_PEPPER = Deno.env.get('OTP_PEPPER') ?? '';
const MAX_ATTEMPTS = 5;

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

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() });
  }

  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const body = await request.json() as ResetPasswordRequest;
    const rawPhone = body.phone?.trim() ?? '';
    const otpCode = body.code?.trim() ?? '';
    const newPassword = body.newPassword?.trim() ?? '';
    const purpose = 'reset_password';

    if (!rawPhone || !otpCode || !newPassword) {
      return jsonResponse(400, { error: 'Telefon raqami, OTP kodi va yangi parol kerak' });
    }

    if (newPassword.length < 6) {
      return jsonResponse(400, { error: 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak' });
    }

    const normalizedPhone = normalizePhone(rawPhone);
    const profile = await lookupProfileByPhone(rawPhone, normalizedPhone);

    if (!profile) {
      return jsonResponse(404, { error: 'Bu telefon raqamiga bog‘langan akkaunt topilmadi.' });
    }

    const { data: rows, error: selectError } = await supabaseAdmin
      .from('phone_otp_verifications')
      .select('id, phone_e164, otp_hash, otp_code, expires_at, attempt_count')
      .eq('phone_e164', normalizedPhone)
      .eq('purpose', purpose)
      .eq('status', 'pending')
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (selectError) {
      return jsonResponse(500, {
        error: 'OTP holatini tekshirishda xato',
        debug_step: 'select_pending_otp',
        code: selectError.code ?? null,
        details: selectError.message,
        hint: selectError.hint ?? null,
      });
    }

    const otpRow = ((rows ?? [])[0] as PendingOtpRow | undefined) ?? null;
    if (!otpRow) {
      return jsonResponse(404, { error: 'OTP topilmadi yoki muddati tugagan' });
    }

    if ((otpRow.attempt_count ?? 0) >= MAX_ATTEMPTS) {
      return jsonResponse(429, { error: 'OTP urinish limiti tugadi' });
    }

    if (!otpRow.expires_at || new Date(otpRow.expires_at).getTime() < Date.now()) {
      await supabaseAdmin
        .from('phone_otp_verifications')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', otpRow.id);

      return jsonResponse(410, { error: 'OTP muddati tugagan' });
    }

    const expectedHash = await hashOtp(normalizedPhone, purpose, otpCode);
    const matches = otpRow.otp_hash === expectedHash || otpRow.otp_code === otpCode;

    if (!matches) {
      await supabaseAdmin
        .from('phone_otp_verifications')
        .update({
          attempt_count: (otpRow.attempt_count ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', otpRow.id);

      return jsonResponse(400, { error: 'Tasdiqlash kodi noto‘g‘ri' });
    }

    const updateUserResult = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
      password: newPassword,
    });

    if (updateUserResult.error) {
      return jsonResponse(500, {
        error: 'Parolni yangilashda xato',
        debug_step: 'auth_admin_update_user',
        details: updateUserResult.error.message,
      });
    }

    const { error: markVerifiedError } = await supabaseAdmin
      .from('phone_otp_verifications')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', otpRow.id);

    if (markVerifiedError) {
      return jsonResponse(500, {
        error: 'OTP holatini yangilashda xato',
        debug_step: 'mark_otp_verified',
        details: markVerifiedError.message,
      });
    }

    return jsonResponse(200, {
      success: true,
      message: 'Parol muvaffaqiyatli yangilandi',
      user_id: profile.id,
      phone: normalizedPhone,
    });
  } catch (error) {
    return jsonResponse(500, {
      error: 'UNCAUGHT_RESET_DEBUG',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });
  }
});
