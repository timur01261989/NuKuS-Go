import { supabase } from '@/services/supabase/supabaseClient';

/**
 * UniGo Super App - Client OTP Service
 * Handles communication with Supabase Edge Functions for sending OTP.
 */
class OtpService {
  /**
   * Sends an OTP via Supabase Edge Function (Telerivet integration)
   * @param {string} phone The E164 formatted phone number (e.g. +998901234567)
   * @returns {Promise<{ success: boolean, error: string | null, data: any }>}
   */
  async sendOtp(phone) {
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phone },
      });

      if (error) {
        throw error;
      }

      return {
        success: Boolean(data?.success),
        error: null,
        data: data ?? null,
      };
    } catch (error) {
      console.error('[OTP_SERVICE_ERROR]: Failed to send OTP via edge function', error?.message || error);

      return {
        success: false,
        error: error?.message || 'OTP yuborishda xatolik',
        data: null,
      };
    }
  }

  /**
   * Verifies the OTP code using Supabase Auth
   * @param {string} phone
   * @param {string} token
   * @returns {Promise<{ success: boolean, error: string | null, data: any }>}
   */
  async verifyOtp(phone, token) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        error: null,
        data: data ?? null,
      };
    } catch (error) {
      console.error('[OTP_VERIFY_ERROR]: Validation failed', error?.message || error);

      return {
        success: false,
        error: error?.message || 'OTP tasdiqlashda xatolik',
        data: null,
      };
    }
  }
}

export const otpService = new OtpService();
export default otpService;
