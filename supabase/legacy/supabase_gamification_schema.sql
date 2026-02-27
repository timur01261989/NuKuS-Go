-- NUKUS GO: Gamification Schema
-- Bu fayl üçüncü bajarilishi kerak (asosiy schema dan keyin)

-- ============================================================
-- DRIVER LEVELS (haydovchi darajalari)
-- ============================================================

create table if not exists public.driver_levels (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  min_trips integer not null default 0,
  min_rating numeric not null default 0,
  commission_rate numeric default 0.15,
  priority_dispatch boolean default false,
  badge_emoji text,
  badge_color text,
  bonus_multiplier numeric default 1.0,
  sort_order integer not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_driver_levels_sort on public.driver_levels(sort_order);

-- Default levels
insert into public.driver_levels (name, min_trips, min_rating, commission_rate, badge_emoji, badge_color, sort_order)
values
  ('Yangi', 0, 0, 0.15, '👤', '#gray', 1),
  ('Tajribali', 50, 4.0, 0.12, '⭐', '#blue', 2),
  ('Professional', 200, 4.5, 0.10, '🏆', '#gold', 3),
  ('Ustalar', 500, 4.8, 0.08, '👑', '#purple', 4)
on conflict (name) do nothing;

-- ============================================================
-- DRIVER GAMIFICATION (haydovchi statistikasi)
-- ============================================================

create table if not exists public.driver_gamification (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null unique references public.profiles(id) on delete cascade,
  level_name text not null default 'Yangi' references public.driver_levels(name),
  total_trips integer not null default 0,
  total_earnings_uzs numeric not null default 0,
  bonus_points integer not null default 0,
  streak_days integer not null default 0,
  last_trip_date date,
  rating numeric default 5.0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_driver_gamif_driver_id on public.driver_gamification(driver_id);
create index if not exists idx_driver_gamif_level on public.driver_gamification(level_name);

alter table public.driver_gamification enable row level security;

drop policy if exists "driver_gamif_select_own" on public.driver_gamification;
create policy "driver_gamif_select_own" on public.driver_gamification
for select to authenticated
using (driver_id = auth.uid());

-- ============================================================
-- DAILY MISSIONS (kunlik missiyalar)
-- ============================================================

create table if not exists public.daily_missions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  target_type text not null check (target_type in ('trips','earnings','distance','rating')),
  target_value integer not null,
  bonus_uzs numeric default 0,
  bonus_points integer default 0,
  level_name text references public.driver_levels(name),
  is_active boolean default true,
  valid_from date default current_date,
  valid_to date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_daily_missions_active on public.daily_missions(is_active);
create index if not exists idx_daily_missions_level on public.daily_missions(level_name);

-- ============================================================
-- MISSION PROGRESS (haydovchining missiyadagi progres)
-- ============================================================

create table if not exists public.mission_progress (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.daily_missions(id) on delete cascade,
  driver_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  current_value integer not null default 0,
  completed boolean default false,
  rewarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists uq_mission_progress on public.mission_progress(mission_id, driver_id, date);
create index if not exists idx_mission_progress_driver on public.mission_progress(driver_id);
create index if not exists idx_mission_progress_date on public.mission_progress(date);

alter table public.mission_progress enable row level security;

drop policy if exists "mission_progress_select_own" on public.mission_progress;
create policy "mission_progress_select_own" on public.mission_progress
for select to authenticated
using (driver_id = auth.uid());

-- ============================================================
-- CLIENT BONUSES (mijozlar bonus ball)
-- ============================================================

create table if not exists public.client_bonuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  points integer not null default 0,
  total_earned integer not null default 0,
  total_spent integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_client_bonuses_user on public.client_bonuses(user_id);

alter table public.client_bonuses enable row level security;

drop policy if exists "client_bonuses_select_own" on public.client_bonuses;
create policy "client_bonuses_select_own" on public.client_bonuses
for select to authenticated
using (user_id = auth.uid());

-- ============================================================
-- BONUS TRANSACTIONS (bonus ball tarixi)
-- ============================================================

create table if not exists public.bonus_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('earn','spend','refund')),
  points integer not null,
  uzs_value numeric,
  order_id uuid references public.orders(id) on delete set null,
  note text,
  created_at timestamptz default now()
);

create index if not exists idx_bonus_tx_user on public.bonus_transactions(user_id);
create index if not exists idx_bonus_tx_kind on public.bonus_transactions(kind);
create index if not exists idx_bonus_tx_created on public.bonus_transactions(created_at desc);

alter table public.bonus_transactions enable row level security;

drop policy if exists "bonus_tx_select_own" on public.bonus_transactions;
create policy "bonus_tx_select_own" on public.bonus_transactions
for select to authenticated
using (user_id = auth.uid());

-- ============================================================
-- GRANTS
-- ============================================================

grant select, insert, update, delete on public.driver_levels to authenticated;
grant select, insert, update, delete on public.driver_gamification to authenticated;
grant select, insert, update, delete on public.daily_missions to authenticated;
grant select, insert, update, delete on public.mission_progress to authenticated;
grant select, insert, update, delete on public.client_bonuses to authenticated;
grant select, insert, update, delete on public.bonus_transactions to authenticated;

grant select on all tables in schema public to anon;
grant usage, select, update on all sequences in schema public to authenticated;
