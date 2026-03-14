// @ts-ignore: Deno implementation
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * UniGo Super App - Telerivet SMS Edge Function
 * Production Grade: Handles CORS, structured responses, and strict error handling.
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone) {
      throw new Error('Phone number is required');
    }

    const TELERIVET_API_KEY = Deno.env.get('TELERIVET_API_KEY');
    const TELERIVET_PROJECT_ID = Deno.env.get('TELERIVET_PROJECT_ID');

    if (!TELERIVET_API_KEY || !TELERIVET_PROJECT_ID) {
      throw new Error('Telerivet system credentials are not configured in edge function environment');
    }

    // Generate a random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const smsContent = UniGo - Yagona Yechim.\nSizning tasdiqlash kodingiz: ${otpCode};

    // Telerivet API payload
    const telerivetUrl = https://api.telerivet.com/v1/projects/${TELERIVET_PROJECT_ID}/messages/send;
    const authHeader = Basic ${btoa(TELERIVET_API_KEY + ':')};

    const telerivetResponse = await fetch(telerivetUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to_number: phone,
        content: smsContent,
      }),
    });

    if (!telerivetResponse.ok) {
      const errorData = await telerivetResponse.json();
      throw new Error(errorData.error?.message || 'Failed to send SMS via Telerivet');
    }

    const result = await telerivetResponse.json();

    return new Response(JSON.stringify({ success: true, messageId: result.id, message: 'OTP sent' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});