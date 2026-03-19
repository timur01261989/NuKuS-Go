-- Safe baseline for OTP storage access
alter table public.phone_otp_verifications enable row level security;

drop policy if exists "service_role_full_access_phone_otp_verifications"
on public.phone_otp_verifications;

create policy "service_role_full_access_phone_otp_verifications"
on public.phone_otp_verifications
for all
to service_role
using (true)
with check (true);

notify pgrst, 'reload schema';
