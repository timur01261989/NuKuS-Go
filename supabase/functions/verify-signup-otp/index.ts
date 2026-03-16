import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
interface JsonObject {
  [key: string]: JsonValue;
}

interface VerifyOtpRequest {
  phone?: string;
  purpose?: 'signup' | string;
  code?: string;
  otp?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  referralCode?: string | null;
}

interface PendingOtpRow {
  id: string;
  phone: string | null;
  phone_e164: string;
  purpose: string;
  otp_hash: string | null;
  expires_at: string | null;
  attempt_count: number;
  metadata: {
    first_name?: string | null;
    last_name?: string | null;
    password?: string | null;
    referral_code?: string | null;
  } | null;
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
  if (String(value).startsWith('+998') && digits.length === 12) return value;
  throw new Error('Telefon raqami noto‘g‘ri formatda');
}

async function hashOtp(phone: string, purpose: string, otpCode: string) {
  const payload = `${phone}:${purpose}:${otpCode}:${OTP_PEPPER}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
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

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() });
  }

  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const body = await request.json() as VerifyOtpRequest;
    const rawPhone = body.phone?.trim() ?? '';
    const otpCode = body.code?.trim() ?? body.otp?.trim() ?? '';
    const purpose = body.purpose === 'signup' ? 'signup' : 'signup';

    if (!rawPhone || !otpCode) {
      return jsonResponse(400, { error: 'Telefon raqami va OTP kodi kerak', code: 'PHONE_OR_CODE_REQUIRED' });
    }

    const normalizedPhone = normalizePhone(rawPhone);

    const { data: rows, error: selectError } = await supabaseAdmin
      .from('phone_otp_verifications')
      .select('id, phone, phone_e164, purpose, otp_hash, expires_at, attempt_count, metadata')
      .eq('phone_e164', normalizedPhone)
      .eq('purpose', purpose)
      .eq('status', 'pending')
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (selectError) {
      return jsonResponse(500, { error: 'OTP holatini tekshirishda xato', code: 'OTP_LOOKUP_FAILED' });
    }

    const otpRow = ((rows ?? [])[0] as PendingOtpRow | undefined) ?? null;
    if (!otpRow) {
      return jsonResponse(404, { error: 'OTP topilmadi yoki muddati tugagan', code: 'OTP_NOT_FOUND' });
    }

    if ((otpRow.attempt_count ?? 0) >= MAX_ATTEMPTS) {
      return jsonResponse(429, { error: 'OTP urinish limiti tugadi', code: 'OTP_ATTEMPTS_EXCEEDED' });
    }

    if (!otpRow.expires_at || new Date(otpRow.expires_at).getTime() < Date.now()) {
      await supabaseAdmin
        .from('phone_otp_verifications')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', otpRow.id);

      return jsonResponse(410, { error: 'OTP muddati tugagan', code: 'OTP_EXPIRED' });
    }

    const expectedHash = await hashOtp(normalizedPhone, purpose, otpCode);
    const matches = otpRow.otp_hash === expectedHash;

    if (!matches) {
      await supabaseAdmin
        .from('phone_otp_verifications')
        .update({
          attempt_count: (otpRow.attempt_count ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', otpRow.id);

      return jsonResponse(400, { error: 'Tasdiqlash kodi noto‘g‘ri', code: 'OTP_INVALID' });
    }

    const existingProfile = await lookupProfileByPhone(rawPhone, normalizedPhone);
    const metadata = otpRow.metadata ?? {};
    const firstName = body.firstName?.trim() || metadata.first_name?.trim() || 'Foydalanuvchi';
    const lastName = body.lastName?.trim() || metadata.last_name?.trim() || '';
    const password = body.password?.trim() || metadata.password?.trim() || '';
    const referralCode = body.referralCode?.trim() || metadata.referral_code?.trim() || null;

    if (existingProfile) {
      await supabaseAdmin
        .from('phone_otp_verifications')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', otpRow.id);

      return jsonResponse(409, {
        error: 'Siz bu raqam bilan ro‘yxatdan o‘tgansiz. Iltimos, login qiling.',
        code: 'PHONE_ALREADY_EXISTS',
      });
    }

    const shouldCreateUser = !!password && password.length >= 6;
    let createdUserId: string | null = null;
    let userCreated = false;

    if (shouldCreateUser) {
      const createUserResult = await supabaseAdmin.auth.admin.createUser({
        phone: normalizedPhone,
        password,
        phone_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          referral_code: referralCode,
        },
      });

      if (createUserResult.error || !createUserResult.data.user) {
        return jsonResponse(500, {
          error: 'Foydalanuvchini yaratishda xato',
          code: 'CREATE_USER_FAILED',
        });
      }

      const user = createUserResult.data.user;
      createdUserId = user.id;
      userCreated = true;

      const profilePayload = {
        id: user.id,
        phone: normalizedPhone.replace('+', ''),
        phone_normalized: normalizedPhone,
        first_name: firstName,
        last_name: lastName,
        phone_verified: true,
        phone_verified_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: profileUpsertError } = await supabaseAdmin
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (profileUpsertError) {
        return jsonResponse(500, {
          error: 'Profilni saqlashda xato',
          code: 'PROFILE_UPSERT_FAILED',
        });
      }
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
        code: 'MARK_VERIFIED_FAILED',
      });
    }

    return jsonResponse(200, {
      success: true,
      message: userCreated
        ? 'Ro‘yxatdan o‘tish muvaffaqiyatli yakunlandi'
        : 'Telefon muvaffaqiyatli tasdiqlandi',
      user_id: createdUserId,
      user_created: userCreated,
      phone: normalizedPhone,
      verified_at: new Date().toISOString(),
      first_name: firstName,
      last_name: lastName,
      referral_code: referralCode,
    });
  } catch (error) {
    console.error('verify-signup-otp failed', error);
    return jsonResponse(500, {
      error: 'OTP tasdiqlashda xato yuz berdi',
      code: 'OTP_VERIFY_FAILED',
    });
  }
});
