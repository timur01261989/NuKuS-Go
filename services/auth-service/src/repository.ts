import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export class AuthRepository {
  async saveOtp(phone: string, code: string) {
    await supabase.from("otp_codes").upsert({ phone, code, expires_at: new Date(Date.now() + 5 * 60000).toISOString() });
  }
  async verifyOtp(phone: string, code: string): Promise<boolean> {
    const { data } = await supabase.from("otp_codes").select("*").eq("phone", phone).eq("code", code).gt("expires_at", new Date().toISOString()).single();
    if (data) await supabase.from("otp_codes").delete().eq("phone", phone);
    return !!data;
  }
  async findUserByPhone(phone: string) {
    const { data } = await supabase.from("profiles").select("id, phone").eq("phone", phone).single();
    return data;
  }
  async createUser(phone: string) {
    const { data } = await supabase.from("profiles").insert({ phone, created_at: new Date().toISOString() }).select("id, phone").single();
    return data!;
  }
  async saveRefreshToken(userId: string, token: string) {
    await supabase.from("refresh_tokens").insert({ user_id: userId, token, created_at: new Date().toISOString() });
  }
  async isRefreshTokenValid(userId: string, token: string): Promise<boolean> {
    const { data } = await supabase.from("refresh_tokens").select("id").eq("user_id", userId).eq("token", token).single();
    return !!data;
  }
  async revokeAllRefreshTokens(userId: string) {
    await supabase.from("refresh_tokens").delete().eq("user_id", userId);
  }
}
