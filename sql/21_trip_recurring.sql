create table if not exists public.trip_recurring_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  service_type text not null default 'intercity',
  recurrence text not null default 'weekly',
  weekdays integer[] not null default '{}',
  departure_time text not null default '07:00',
  template_payload jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
