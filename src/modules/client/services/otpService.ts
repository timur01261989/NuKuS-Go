import { supabase } from '@/services/supabase/supabaseClient';

/**
 * UniGo Super App - Client OTP Service
 * Handles communication with Supabase Edge Functions for sending OTP.
 */
class OtpService {
  /**
   * Sends an OTP via Supabase Edge Function (Telerivet integration)
   * @param phone The E164 formatted phone number (e.g., +998901234567)
   */
  async sendOtp(phone: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phone },
      });

      if (error) {
        throw error;
      }

      return data?.success || false;
    } catch (error: any) {
      console.error('[OTP_SERVICE_ERROR]: Failed to send OTP via edge function', error.message);
      throw error;
    }
  }

  /**
   * Verifies the OTP code locally using Supabase Auth
   */
  async verifyOtp(phone: string, token: string): Promise<any> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('[OTP_VERIFY_ERROR]: Validation failed', error.message);
      throw error;
    }
  }
}

export const otpService = new OtpService();