import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// HARDCODE QILINMAYDI - Xavfsizlik uchun Environment Variables ishlatamiz
const TELERIVET_API_KEY = Deno.env.get('TELERIVET_API_KEY')!;
const PROJECT_ID = Deno.env.get('TELERIVET_PROJECT_ID') || '75254d4a';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();
    if (!phone) throw new Error('Phone is required');

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: dbError } = await supabaseAdmin
      .from('otp_verifications')
      .insert([{ phone_number: phone, code: otpCode }]);

    if (dbError) throw dbError;

    const authHeader = btoa(${TELERIVET_API_KEY}:);
    await fetch(https://api.telerivet.com/v1/projects/${PROJECT_ID}/messages/send, {
      method: 'POST',
      headers: {
        'Authorization': Basic ${authHeader},
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to_number: phone,
        content: UniGO: Kod ${otpCode},
      })
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});