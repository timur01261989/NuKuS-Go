import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type JsonRecord = Record<string, unknown>;

interface SendOtpBody {
  phone: string;
  purpose?: 'signup' | 'phone_change' | 'reset_password';
}

interface TelerivetSendResponse {
  id?: string;
  status?: string;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

interface ProfileRow {
  id: string;
  phone: string | null;
  phone_normalized?: string | null;
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
const MAX_ATTEMPTS = 5;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

if (!TELERIVET_API_KEY || !TELERIVET_PROJECT_ID || !TELERIVET_ROUTE_ID || !OTP_PEPPER) {
  throw new Error('Missing Telerivet or OTP environment variables');
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
  const cleaned = String(rawPhone).replace(/[^\d+]/g, '');

  if (/^\+998\d{9}$/.test(cleaned)) return cleaned;
  if (/^998\d{9}$/.test(cleaned)) return `+${cleaned}`;
  if (/^\d{9}$/.test(cleaned)) return `+998${cleaned}`;

  throw new Error('Telefon raqam formati noto‘g‘ri. Masalan: +998901234567');
}

function normalizePhoneForProfile(phone: string): string {
  return phone.replace(/\D/g, '').startsWith('998') ? `+${phone.replace(/\D/g, '')}` : phone;
}

function generateOtpCode(): string {
  const random = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
  return String(random).padStart(6, '0');
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashOtp(phone: string, purpose: string, otp: string): Promise<string> {
  return sha256Hex(`${phone}:${purpose}:${otp}:${OTP_PEPPER}`);
}

function getBasicAuthHeader(apiKey: string): string {
  const bytes = new TextEncoder().encode(`${apiKey}:`);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `Basic ${btoa(binary)}`;
}

async function sendTelerivetSms(phone: string, content: string): Promise<TelerivetSendResponse> {
  const url = `https://api.telerivet.com/v1/projects/${encodeURIComponent(TELERIVET_PROJECT_ID)}/messages/send`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: getBasicAuthHeader(TELERIVET_API_KEY),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content,
      to_number: phone,
      route_id: TELERIVET_ROUTE_ID,
    }),
  });

  const responseText = await response.text();
  let parsed: TelerivetSendResponse = {};

  try {
    parsed = responseText ? (JSON.parse(responseText) as TelerivetSendResponse) : {};
  } catch {
    parsed = { message: responseText };
  }

  if (!response.ok) {
    throw new Error(`Telerivet SMS yuborishda xato: ${response.status} ${JSON.stringify(parsed)}`);
  }

  return parsed;
}

async function findProfileByPhone(phone: string): Promise<ProfileRow | null> {
  const normalized = normalizePhoneForProfile(phone);

  const byNormalized = await supabaseAdmin
    .from('profiles')
    .select('id, phone, phone_normalized')
    .eq('phone_normalized', normalized)
    .limit(1)
    .maybeSingle();

  if (byNormalized.error && byNormalized.error.code !== 'PGRST116') {
    throw new Error(`Telefon bo'yicha profilni tekshirishda xato: ${byNormalized.error.message}`);
  }

  if (byNormalized.data) {
    return byNormalized.data as ProfileRow;
  }

  const byPhone = await supabaseAdmin
    .from('profiles')
    .select('id, phone, phone_normalized')
    .eq('phone', normalized)
    .limit(1)
    .maybeSingle();

  if (byPhone.error && byPhone.error.code !== 'PGRST116') {
    throw new Error(`Telefon bo'yicha profilni tekshirishda xato: ${byPhone.error.message}`);
  }

  return (byPhone.data as ProfileRow | null) ?? null;
}

function buildSmsContent(purpose: 'signup' | 'phone_change' | 'reset_password', otpCode: string): string {
  if (purpose === 'reset_password') {
    return `UniGo parol tiklash kodi: ${otpCode}. Kod 3 daqiqa amal qiladi. Uni hech kimga bermang.`;
  }
  if (purpose === 'phone_change') {
    return `UniGo telefon almashtirish kodi: ${otpCode}. Kod 3 daqiqa amal qiladi. Uni hech kimga bermang.`;
  }
  return `UniGo tasdiqlash kodi: ${otpCode}. Kod 3 daqiqa amal qiladi. Uni hech kimga bermang.`;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const body = (await req.json()) as SendOtpBody;
    const purpose = body.purpose ?? 'signup';
    const phone = normalizeUzbekPhone(body.phone);
    const profile = await findProfileByPhone(phone);

    if (purpose === 'signup' && profile) {
      return jsonResponse(409, {
        error: 'Bu telefon raqam bilan allaqachon ro‘yxatdan o‘tilgan. Iltimos, login qiling.',
      });
    }

    if (purpose === 'reset_password' && !profile) {
      return jsonResponse(404, {
        error: 'Bu telefon raqam bilan foydalanuvchi topilmadi.',
      });
    }

    const nowIso = new Date().toISOString();

    const { data: existingPendingList, error: existingPendingError } = await supabaseAdmin
      .from('phone_otp_verifications')
      .select('id, resend_count, last_sent_at, status, expires_at')
      .eq('phone_e164', phone)
      .eq('purpose', purpose)
      .eq('status', 'pending')
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingPendingError) {
      return jsonResponse(500, {
        error: 'OTP holatini tekshirishda xato',
        details: existingPendingError.message,
      });
    }

    const existingPending = existingPendingList?.[0] ?? null;

    if (existingPending) {
      const cooldownEndsAt = new Date(new Date(existingPending.last_sent_at).getTime() + RESEND_COOLDOWN_SECONDS * 1000);
      if (cooldownEndsAt.getTime() > Date.now()) {
        const retryAfter = Math.ceil((cooldownEndsAt.getTime() - Date.now()) / 1000);
        return jsonResponse(429, {
          error: 'OTP qayta yuborish uchun kuting',
          retry_after_seconds: retryAfter,
        });
      }

      if (existingPending.resend_count >= MAX_RESEND_COUNT) {
        const { error: blockError } = await supabaseAdmin
          .from('phone_otp_verifications')
          .update({ status: 'blocked' })
          .eq('id', existingPending.id);

        if (blockError) {
          return jsonResponse(500, {
            error: 'OTP bloklashda xato',
            details: blockError.message,
          });
        }

        return jsonResponse(429, {
          error: 'Juda ko‘p marta OTP so‘raldi. Keyinroq urinib ko‘ring.',
        });
      }

      const { error: cancelError } = await supabaseAdmin
        .from('phone_otp_verifications')
        .update({ status: 'cancelled' })
        .eq('id', existingPending.id);

      if (cancelError) {
        return jsonResponse(500, {
          error: 'Eski OTP ni bekor qilishda xato',
          details: cancelError.message,
        });
      }
    }

    const otpCode = generateOtpCode();
    const otpHash = await hashOtp(phone, purpose, otpCode);
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString();
    const smsContent = buildSmsContent(purpose, otpCode);
    const telerivetResponse = await sendTelerivetSms(phone, smsContent);
    const resendCount = existingPending ? Math.min((existingPending.resend_count ?? 0) + 1, MAX_RESEND_COUNT) : 1;

    const { error: insertError } = await supabaseAdmin.from('phone_otp_verifications').insert({
      phone_e164: phone,
      purpose,
      otp_hash: otpHash,
      expires_at: expiresAt,
      attempt_count: 0,
      max_attempts: MAX_ATTEMPTS,
      resend_count: resendCount,
      last_sent_at: nowIso,
      verified_at: null,
      status: 'pending',
      provider: 'telerivet',
      provider_message_id: typeof telerivetResponse.id === 'string' ? telerivetResponse.id : null,
      metadata: {
        telerivet_status: telerivetResponse.status ?? null,
      },
    });

    if (insertError) {
      return jsonResponse(500, {
        error: 'OTP ma’lumotini saqlashda xato',
        details: insertError.message,
      });
    }

    return jsonResponse(200, {
      success: true,
      message: purpose === 'reset_password' ? 'Parol tiklash kodi yuborildi' : 'OTP yuborildi',
      phone,
      purpose,
      expires_in_seconds: OTP_TTL_SECONDS,
      resend_cooldown_seconds: RESEND_COOLDOWN_SECONDS,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Noma’lum xato';
    return jsonResponse(400, { error: message });
  }
});
