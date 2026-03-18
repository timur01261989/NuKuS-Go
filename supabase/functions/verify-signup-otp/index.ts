import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
interface JsonObject { [key: string]: JsonValue; }

interface VerifyOtpRequest {
  phone?: string;
  purpose?: 'signup' | string;
  otp?: string;
  code?: string;
}

interface AccountLookupRow {
  exists_account: boolean;
  profile_id: string | null;
  auth_user_id: string | null;
  matched_phone: string | null;
}

interface PendingOtpRow {
  id: string;
  otp_hash: string | null;
  expires_at: string | null;
  attempt_count: number;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const OTP_PEPPER = Deno.env.get('OTP_PEPPER') ?? '';
const MAX_ATTEMPTS = 5;

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
  return new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders(), 'Content-Type': 'application/json; charset=utf-8' } });
}
function normalizePhone(input: string): string {
  const digitsOnly = input.replace(/\D/g, '');
  if (digitsOnly.length === 12 && digitsOnly.startsWith('998')) return `+${digitsOnly}`;
  if (digitsOnly.length === 9) return `+998${digitsOnly}`;
  throw new Error('Telefon raqami noto‘g‘ri formatda. Masalan: +998901234567');
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
  const rows = Array.isArray(data) ? data as AccountLookupRow[] : [];
  return rows[0] ?? null;
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });
  if (request.method !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
  try {
    const body = await request.json() as VerifyOtpRequest;
    const rawPhone = String(body.phone ?? '').trim();
    const otpCode = String(body.otp ?? body.code ?? '').replace(/\D/g, '').slice(0, 6);
    const purpose = 'signup';
    if (!rawPhone || otpCode.length !== 6) return jsonResponse(400, { error: 'Telefon raqami va OTP kodi kerak' });

    const normalizedPhone = normalizePhone(rawPhone);
    const { data, error } = await supabaseAdmin.rpc('otp_get_pending_full', { p_phone_e164: normalizedPhone, p_purpose: purpose });
    if (error) {
      return jsonResponse(500, { error: 'OTP holatini tekshirishda xato', debug_step: 'select_pending_otp', code: error.code ?? null, details: error.message, hint: error.hint ?? null });
    }
    const rows = Array.isArray(data) ? data as PendingOtpRow[] : [];
    const otpRow = rows[0] ?? null;
    if (!otpRow) return jsonResponse(404, { error: 'OTP topilmadi yoki muddati tugagan' });
    if (Number(otpRow.attempt_count ?? 0) >= MAX_ATTEMPTS) return jsonResponse(429, { error: 'OTP urinish limiti tugadi' });
    if (!otpRow.expires_at || new Date(otpRow.expires_at).getTime() < Date.now()) {
      await supabaseAdmin.rpc('otp_mark_status', { p_id: otpRow.id, p_status: 'expired', p_verified_at: null });
      return jsonResponse(410, { error: 'OTP muddati tugagan' });
    }
    const expectedHash = await hashOtp(normalizedPhone, purpose, otpCode);
    const matches = otpRow.otp_hash === expectedHash || otpRow.otp_code === otpCode;
    if (!matches) {
      await supabaseAdmin.rpc('otp_bump_attempt', { p_id: otpRow.id });
      return jsonResponse(400, { error: 'Tasdiqlash kodi noto‘g‘ri' });
    }

    const existing = await lookupAccountByPhone(normalizedPhone);
    if (existing?.exists_account) {
      await supabaseAdmin.rpc('otp_mark_status', { p_id: otpRow.id, p_status: 'verified', p_verified_at: new Date().toISOString() });
      return jsonResponse(409, { error: 'Siz bu raqam bilan ro‘yxatdan o‘tgansiz. Iltimos, login qiling.' });
    }

    const { error: markError } = await supabaseAdmin.rpc('otp_mark_status', {
      p_id: otpRow.id,
      p_status: 'verified',
      p_verified_at: new Date().toISOString(),
    });
    if (markError) {
      return jsonResponse(500, { error: 'OTP holatini yangilashda xato', debug_step: 'mark_otp_verified', details: markError.message });
    }

    return jsonResponse(200, {
      success: true,
      message: 'Telefon muvaffaqiyatli tasdiqlandi',
      phone: normalizedPhone,
      purpose,
      verified_at: new Date().toISOString(),
    });
  } catch (error) {
    return jsonResponse(500, { error: 'UNCAUGHT_VERIFY_DEBUG', details: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : null });
  }
});
