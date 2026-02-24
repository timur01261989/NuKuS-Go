-- NUKUS GO: Notifications Schema
-- Bu fayl beshinchi bajarilishi kerak

-- ============================================================
-- NOTIFICATIONS (barcha bildirishnomalar)
-- ============================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  action_url text,
  notif_type text check (notif_type in ('order','promo','system','driver','payment')),
  is_read boolean default false,
  sent_at timestamptz default now(),
  read_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(is_read);
create index if not exists idx_notifications_type on public.notifications(notif_type);
create index if not exists idx_notifications_created on public.notifications(created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ============================================================
-- PUSH SUBSCRIPTIONS (web push subscriber)
-- ============================================================

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists uq_push_subscriptions_endpoint on public.push_subscriptions(endpoint);
create index if not exists idx_push_subs_user on public.push_subscriptions(user_id);
create index if not exists idx_push_subs_active on public.push_subscriptions(is_active);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subs_insert_own" on public.push_subscriptions;
create policy "push_subs_insert_own" on public.push_subscriptions
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "push_subs_select_own" on public.push_subscriptions;
create policy "push_subs_select_own" on public.push_subscriptions
for select to authenticated
using (user_id = auth.uid());

-- ============================================================
-- SMS LOG (SMS xabarlar tarixi)
-- ============================================================

create table if not exists public.sms_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  phone_number text not null,
  message_text text not null,
  sms_type text check (sms_type in ('verification','otp','notification','alert')),
  status text not null check (status in ('pending','sent','failed','delivered')) default 'pending',
  provider text,
  provider_message_id text,
  sent_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_sms_logs_user on public.sms_logs(user_id);
create index if not exists idx_sms_logs_phone on public.sms_logs(phone_number);
create index if not exists idx_sms_logs_status on public.sms_logs(status);

-- ============================================================
-- EMAIL LOG (Email xabarlar tarixi)
-- ============================================================

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  email_address text not null,
  subject text not null,
  html_body text,
  email_type text check (email_type in ('verification','receipt','notification','promo')),
  status text not null check (status in ('pending','sent','failed','bounced')) default 'pending',
  provider text,
  provider_message_id text,
  sent_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_email_logs_user on public.email_logs(user_id);
create index if not exists idx_email_logs_email on public.email_logs(email_address);
create index if not exists idx_email_logs_status on public.email_logs(status);

-- ============================================================
-- NOTIFICATION PREFERENCES (foydalanuvchi sozlamalari)
-- ============================================================

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  push_enabled boolean default true,
  sms_enabled boolean default true,
  email_enabled boolean default true,
  order_notifications boolean default true,
  promo_notifications boolean default true,
  system_notifications boolean default true,
  driver_notifications boolean default true,
  quiet_hours_enabled boolean default false,
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_notif_prefs_user on public.notification_preferences(user_id);

alter table public.notification_preferences enable row level security;

drop policy if exists "notif_prefs_select_own" on public.notification_preferences;
create policy "notif_prefs_select_own" on public.notification_preferences
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "notif_prefs_upsert_own" on public.notification_preferences;
create policy "notif_prefs_upsert_own" on public.notification_preferences
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "notif_prefs_update_own" on public.notification_preferences;
create policy "notif_prefs_update_own" on public.notification_preferences
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ============================================================
-- GRANTS
-- ============================================================

grant select, insert, update, delete on public.notifications to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant select, insert on public.sms_logs to authenticated;
grant select, insert on public.email_logs to authenticated;
grant select, insert, update, delete on public.notification_preferences to authenticated;

grant select on all tables in schema public to anon;
grant usage, select, update on all sequences in schema public to authenticated;
