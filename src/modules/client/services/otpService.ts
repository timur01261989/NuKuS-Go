/**
 * UniGo OTP Service (Client-side)
 * Role: Acts as a bridge between UI and Supabase Edge Functions.
 * Optimization: Memory-efficient, zero-side effects.
 */
import { supabase } from '../../../lib/supabase'; // Supabase client manzilingizga qarab moslang

interface OtpResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const otpService = {
  /**
   * Telerivet orqali SMS yuborish funksiyasi
   * @param phone - Format: +998XXXXXXXXX
   */
  sendOtp: async (phone: string): Promise<OtpResponse> => {
    try {
      // Edge Function nomi: 'send-otp'
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phone },
      });

      if (error) {
        throw new Error(error.message || 'Edge Function execution failed');
      }

      return {
        success: data.success,
        messageId: data.messageId,
        error: data.error
      };
    } catch (err: any) {
      console.error('[OTP_SERVICE_ERROR]:', err.message);
      return {
        success: false,
        error: err.message
      };
    }
  },

  /**
   * Foydalanuvchi kiritgan kodni tekshirish (ixtiyoriy, agar Edge Function-da qilsangiz)
   */
  verifyOtp: async (phone: string, code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('phone_number', phone)
        .eq('code', code)
        .eq('is_verified', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return { success: false, error: 'Kod noto\'g\'ri yoki muddati o\'tgan' };
      }

      // Kodni ishlatilgan deb belgilash
      await supabase
        .from('otp_verifications')
        .update({ is_verified: true })
        .eq('id', data.id);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
};