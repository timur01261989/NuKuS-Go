UniGo phone OTP Supabase full rewrite

1. SQL Editor ichida RUN qiling:
   supabase/migrations/20260316_000001_phone_otp_schema.sql
   supabase/migrations/20260316_000002_phone_otp_rpcs.sql

2. Loyihadagi supabase papkasini shu zip ichidagi supabase bilan almashtiring.

3. Deploy qiling:
   npx supabase functions deploy send-signup-otp --no-verify-jwt
   npx supabase functions deploy verify-signup-otp --no-verify-jwt
   npx supabase functions deploy reset-password-with-otp --no-verify-jwt
   npx supabase functions deploy telerivet-sms-hook --no-verify-jwt

4. Vercel frontendni redeploy qiling.

5. Browser cache tozalab qayta tekshiring.

Muhim:
- SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL, SUPABASE_ANON_KEY reserved secret bo'lib Supabase tomonidan avtomatik inject qilinadi.
- TELErivet secretlar Edge Functions -> Secrets ichida bo'lishi kerak:
  TELErIVET_API_KEY
  TELErIVET_PROJECT_ID
  TELErIVET_ROUTE_ID
  OTP_PEPPER
