import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type JsonRecord = Record<string, unknown>;

type SendOtpPurpose = 'signup' | 'phone_change' | 'reset_password';

interface SendOtpBody {
  phone: string;
  purpose?: SendOtpPurpose;
}

interface TelerivetSendResponse {
  id?: string;
  status?: string;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

interface ProfileLookupRow {
  id: string;
  phone: string | null;
  phone_normalized: string | null;
}

interface PendingOtpRow {
  id: string;
  resend_count: number;
  last_sent_at: string;
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
  const cleaned = String(rawPhone || '').replace(/[^\d+]/g, '');

  if (/^\+998\d{9}$/.test(cleaned)) return cleaned;
  if (/^998\d{9}$/.test(cleaned)) return `+${cleaned}`;
  if (/^\d{9}$/.test(cleaned)) return `+998${cleaned}`;

  throw new Error('Telefon raqam formati noto‘g‘ri. Masalan: +998901234567');
}

function normalizePhoneForProfile(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.startsWith('998') ? `+${digits}` : phone;
}

function generateOtpCode(): string {
  const random = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
  return String(random).padStart(6, '0');
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashOtp(phone: string, purpose: SendOtpPurpose, otp: string): Promise<string> {
  return sha256Hex(`${phone}:${purpose}:${otp}:${OTP_PEPPER}`);
}

function getBasicAuthHeader(apiKey: string): string {
  const bytes = new TextEncoder().encode(`${apiKey}:`);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return `Basic ${btoa(binary)}`;
}

function buildSmsContent(purpose: SendOtpPurpose, otpCode: string): string {
  if (purpose === 'reset_password') {
    return `UniGo parol tiklash kodi: ${otpCode}. Kod 3 daqiqa amal qiladi. Uni hech kimga bermang.`;
  }

  if (purpose === 'phone_change') {
    return `UniGo telefon almashtirish kodi: ${otpCode}. Kod 3 daqiqa amal qiladi. Uni hech kimga bermang.`;
  }

  return `UniGo tasdiqlash kodi: ${otpCode}. Kod 3 daqiqa amal qiladi. Uni hech kimga bermang.`;
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

  const rawText = await response.text();
  let parsed: TelerivetSendResponse = {};

  try {
    parsed = rawText ? (JSON.parse(rawText) as TelerivetSendResponse) : {};
  } catch {
    parsed = { message: rawText };
  }

  if (!response.ok) {
    throw new Error(`Telerivet SMS yuborishda xato: ${response.status} ${JSON.stringify(parsed)}`);
  }

  return parsed;
}

async function findProfileByPhone(phone: string): Promise<ProfileLookupRow | null> {
  const normalized = normalizePhoneForProfile(phone);

  const { data, error } = await supabaseAdmin
    .rpc('find_profile_by_phone', { p_phone: normalized })
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Telefon bo'yicha profilni tekshirishda xato: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    id: String((data as JsonRecord).id ?? ''),
    phone: ((data as JsonRecord).phone as string | null) ?? null,
    phone_normalized: ((data as JsonRecord).phone_normalized as string | null) ?? null,
  };
}

async function cancelPendingOtpById(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('phone_otp_verifications')
    .update({ status: 'cancelled' })
    .eq('id', id);

  if (error) {
    throw new Error(`Oldingi OTP ni bekor qilishda xato: ${error.message}`);
  }
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
    const purpose: SendOtpPurpose = body.purpose ?? 'signup';
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
        details: pendingError.message,
      });
    }

    const pending = ((pendingRows?.[0] as PendingOtpRow | undefined) ?? null);

    if (pending) {
      const cooldownEndsAt = new Date(new Date(pending.last_sent_at).getTime() + RESEND_COOLDOWN_SECONDS * 1000);
      if (cooldownEndsAt.getTime() > Date.now()) {
        return jsonResponse(429, {
          error: 'OTP qayta yuborish uchun kuting',
          retry_after_seconds: Math.ceil((cooldownEndsAt.getTime() - Date.now()) / 1000),
        });
      }

      if (pending.resend_count >= MAX_RESEND_COUNT) {
        const { error: blockError } = await supabaseAdmin
          .from('phone_otp_verifications')
          .update({ status: 'blocked' })
          .eq('id', pending.id);

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

      await cancelPendingOtpById(pending.id);
    }

    const otpCode = generateOtpCode();
    const otpHash = await hashOtp(phone, purpose, otpCode);
    const now = new Date();
    const nowIso = now.toISOString();
    const expiresAtIso = new Date(now.getTime() + OTP_TTL_SECONDS * 1000).toISOString();
    const smsContent = buildSmsContent(purpose, otpCode);

    const smsResult = await sendTelerivetSms(phone, smsContent);

    const nextResendCount = pending ? pending.resend_count + 1 : 0;

    const { error: insertError } = await supabaseAdmin
      .from('phone_otp_verifications')
      .insert({
        phone_e164: phone,
        purpose,
        otp_hash: otpHash,
        status: 'pending',
        resend_count: nextResendCount,
        attempt_count: 0,
        max_attempts: MAX_ATTEMPTS,
        sent_via: 'telerivet',
        provider_message_id: smsResult.id ?? null,
        provider_response: smsResult as unknown as JsonRecord,
        expires_at: expiresAtIso,
        last_sent_at: nowIso,
      });

    if (insertError) {
      return jsonResponse(500, {
        error: 'OTP yozishda xato',
        details: insertError.message,
      });
    }

    return jsonResponse(200, {
      success: true,
      phone,
      purpose,
      message: purpose === 'reset_password' ? 'Tiklash kodi yuborildi.' : 'Tasdiqlash kodi yuborildi.',
      expires_in_seconds: OTP_TTL_SECONDS,
      resend_cooldown_seconds: RESEND_COOLDOWN_SECONDS,
      provider_status: smsResult.status ?? 'queued',
    });
  } catch (error) {
    return jsonResponse(400, {
      error: error instanceof Error ? error.message : 'OTP yuborishda xato yuz berdi.',
    });
  }
});
