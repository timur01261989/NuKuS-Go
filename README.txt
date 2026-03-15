1. Replace these files in your project:
   - supabase/functions/send-signup-otp/index.ts
   - supabase/functions/verify-signup-otp/index.ts
   - supabase/functions/reset-password-with-otp/index.ts

2. Run SQL file:
   - supabase/migrations/20260316_000003_service_role_policy_only.sql

3. Deploy:
   npx supabase functions deploy send-signup-otp --no-verify-jwt
   npx supabase functions deploy verify-signup-otp --no-verify-jwt
   npx supabase functions deploy reset-password-with-otp --no-verify-jwt

4. Hard refresh browser with Ctrl+F5.

This patch forces all OTP-table reads/writes through supabaseAdmin only.
