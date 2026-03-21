import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class OtpStrategy {
  /**
   * Generate a 6-digit OTP, store in DB, send via Eskiz SMS
   */
  async sendOtp(phone: string): Promise<{ ok: boolean; expiresIn: number }> {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

    await sb.from("otp_codes").upsert(
      { phone, code, expires_at: expiresAt },
      { onConflict: "phone" }
    );

    await this.sendSms(phone, `UniGo: Tasdiqlash kodi: ${code}. 5 daqiqa amal qiladi.`);
    return { ok: true, expiresIn: OTP_TTL_MS / 1000 };
  }

  async verifyOtp(phone: string, code: string): Promise<boolean> {
    const { data } = await sb
      .from("otp_codes")
      .select("code, expires_at")
      .eq("phone", phone)
      .single();

    if (!data) return false;
    if (data.code !== code) return false;
    if (new Date(data.expires_at) < new Date()) return false;

    // Delete after successful verification (one-time use)
    await sb.from("otp_codes").delete().eq("phone", phone);
    return true;
  }

  private async sendSms(phone: string, message: string): Promise<void> {
    const email    = process.env.ESKIZ_EMAIL    || "";
    const password = process.env.ESKIZ_PASSWORD || "";
    if (!email || !password) {
      console.warn(`[OTP] SMS not sent (no credentials). Code for ${phone}: ${message}`);
      return;
    }
    try {
      const loginRes = await fetch("https://notify.eskiz.uz/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const { data } = await loginRes.json();
      const token = data?.token;
      if (!token) return;

      await fetch("https://notify.eskiz.uz/api/message/sms/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobile_phone: phone.replace("+", ""),
          message,
          from: "4546",
          callback_url: "",
        }),
      });
    } catch (e) {
      console.error("[OTP] SMS send failed:", e);
    }
  }
}
