import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type JsonRecord = Record<string, unknown>;

interface ResetPasswordBody {
  phone: string;
  new_password: string;
}

interface ProfileRow {
  id: string;
  phone: string | null;
  phone_normalized: string | null;
}

interface VerifiedOtpRow {
  id: string;
  verified_at: string | null;
  metadata: Record<string, unknown> | null;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
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

  if (/^\+998\d{9}$/.test(cleaned)) {
    return cleaned;
  }

  if (/^998\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  if (/^\d{9}$/.test(cleaned)) {
    return `+998${cleaned}`;
  }

  throw new Error('Telefon raqam formati noto‘g‘ri. Masalan: +998901234567');
}

function validatePassword(password: string): string {
  const normalized = String(password || '').trim();
  if (normalized.length < 6) {
    throw new Error('Parol kamida 6 ta belgidan iborat bo‘lishi kerak.');
  }
  return normalized;
}

async function findProfileByPhone(phone: string): Promise<ProfileRow | null> {
  const byNormalized = await supabase
    .from('profiles')
    .select('id, phone, phone_normalized')
    .eq('phone_normalized', phone)
    .limit(1)
    .maybeSingle();

  if (byNormalized.error) {
    throw new Error(`Telefon bo‘yicha profilni tekshirishda xato: ${byNormalized.error.message}`);
  }

  if (byNormalized.data) {
    return byNormalized.data as ProfileRow;
  }

  const byPhone = await supabase
    .from('profiles')
    .select('id, phone, phone_normalized')
    .eq('phone', phone)
    .limit(1)
    .maybeSingle();

  if (byPhone.error) {
    throw new Error(`Telefon bo‘yicha profilni tekshirishda xato: ${byPhone.error.message}`);
  }

  return (byPhone.data as ProfileRow | null) ?? null;
}

async function getLatestVerifiedResetOtp(phone: string): Promise<VerifiedOtpRow | null> {
  const { data, error } = await supabase
    .from('phone_otp_verifications')
    .select('id, verified_at, metadata')
    .eq('phone_e164', phone)
    .eq('purpose', 'reset_password')
    .eq('status', 'verified')
    .order('verified_at', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Tasdiqlangan OTP ni o‘qishda xato: ${error.message}`);
  }

  return (data?.[0] as VerifiedOtpRow | undefined) ?? null;
}

function ensureOtpEligible(otpRow: VerifiedOtpRow | null): VerifiedOtpRow {
  if (!otpRow?.verified_at) {
    throw new Error('Parolni tiklash uchun avval SMS kodni tasdiqlang.');
  }

  const verifiedAtMs = new Date(otpRow.verified_at).getTime();
  if (!Number.isFinite(verifiedAtMs)) {
    throw new Error('Tasdiqlangan OTP holati noto‘g‘ri.');
  }

  if (Date.now() - verifiedAtMs > 10 * 60 * 1000) {
    throw new Error('Tasdiqlangan kod eskirgan. Qaytadan SMS kod oling.');
  }

  const metadata = otpRow.metadata ?? {};
  if (metadata.reset_completed_at) {
    throw new Error('Bu SMS kod allaqachon ishlatilgan. Qaytadan SMS kod oling.');
  }

  return otpRow;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const body = (await req.json()) as ResetPasswordBody;
    const phone = normalizeUzbekPhone(body.phone);
    const newPassword = validatePassword(body.new_password);

    const profile = await findProfileByPhone(phone);
    if (!profile?.id) {
      throw new Error('Bu telefon raqam bilan foydalanuvchi topilmadi.');
    }

    const verifiedOtp = ensureOtpEligible(await getLatestVerifiedResetOtp(phone));
    const resetCompletedAt = new Date().toISOString();

    const { error: updatePasswordError } = await supabase.auth.admin.updateUserById(profile.id, {
      password: newPassword,
      phone_confirm: true,
      user_metadata: {
        phone,
        password_reset_at: resetCompletedAt,
      },
    });

    if (updatePasswordError) {
      throw new Error(`Parolni yangilashda xato: ${updatePasswordError.message}`);
    }

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        phone,
        phone_normalized: phone,
        phone_verified: true,
        phone_verified_at: resetCompletedAt,
        updated_at: resetCompletedAt,
      })
      .eq('id', profile.id);

    if (profileUpdateError) {
      throw new Error(`Profilni yangilashda xato: ${profileUpdateError.message}`);
    }

    const nextMetadata = {
      ...(verifiedOtp.metadata ?? {}),
      reset_completed_at: resetCompletedAt,
    };

    const { error: otpUpdateError } = await supabase
      .from('phone_otp_verifications')
      .update({
        metadata: nextMetadata,
      })
      .eq('id', verifiedOtp.id);

    if (otpUpdateError) {
      throw new Error(`OTP holatini yakunlashda xato: ${otpUpdateError.message}`);
    }

    return jsonResponse(200, {
      success: true,
      message: 'Parol muvaffaqiyatli yangilandi.',
      phone,
      reset_completed_at: resetCompletedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Noma’lum xato';
    return jsonResponse(400, {
      error: message,
    });
  }
});
