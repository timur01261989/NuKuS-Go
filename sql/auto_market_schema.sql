-- UniGo: AUTO MARKET (Avto Savdo) schema
-- Bu faylni Supabase SQL editor'da ishga tushiring.
-- Talab: public.profiles jadvali mavjud bo'lishi kerak (auth uid bilan bog'langan).

-- ============================================================
-- AUTO ADS (e'lonlar)
-- ============================================================
create table if not exists public.auto_ads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,

  title text not null,
  brand text,
  model text,
  year int,
  mileage int,
  price numeric,
  currency text default 'UZS',
  city text,
  location jsonb,

  fuel_type text,
  transmission text,
  color text,
  body_type text,
  drive_type text,
  engine text,

  description text,
  vin text,
  kredit boolean default false,
  exchange boolean default false,
  comfort jsonb,

  status text not null default 'pending' check (status in ('pending','active','rejected','archived','sold')),
  is_top boolean default false,
  views int not null default 0,

  seller_name text,
  seller_phone text,
  seller_rating numeric,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  approved_at timestamptz
);

create index if not exists idx_auto_ads_created on public.auto_ads(created_at desc);
create index if not exists idx_auto_ads_user on public.auto_ads(user_id);
create index if not exists idx_auto_ads_city on public.auto_ads(city);
create index if not exists idx_auto_ads_brand_model on public.auto_ads(brand, model);
create index if not exists idx_auto_ads_status on public.auto_ads(status);

alter table public.auto_ads enable row level security;

-- Hamma active/pending e'lonlarni ko'rishi mumkin (pending: egasi uchun)
-- Biz policy'ni shunday qilamiz:
--  - active: hamma ko'radi
--  - pending: faqat egasi ko'radi
--  - rejected/archived/sold: faqat egasi (yoki admin) ko'radi

drop policy if exists "auto_ads_select_public" on public.auto_ads;
create policy "auto_ads_select_public" on public.auto_ads
for select
using (
  status = 'active'
  OR (auth.role() = 'authenticated' AND user_id = auth.uid())
);

drop policy if exists "auto_ads_insert_own" on public.auto_ads;
create policy "auto_ads_insert_own" on public.auto_ads
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "auto_ads_update_own" on public.auto_ads;
create policy "auto_ads_update_own" on public.auto_ads
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ============================================================
-- AUTO AD IMAGES
-- ============================================================
create table if not exists public.auto_ad_images (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.auto_ads(id) on delete cascade,
  url text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

create index if not exists idx_auto_ad_images_ad on public.auto_ad_images(ad_id);
alter table public.auto_ad_images enable row level security;

drop policy if exists "auto_ad_images_select" on public.auto_ad_images;
create policy "auto_ad_images_select" on public.auto_ad_images
for select
using (
  exists (
    select 1 from public.auto_ads a
    where a.id = auto_ad_images.ad_id
      and (a.status = 'active' or (auth.role() = 'authenticated' and a.user_id = auth.uid()))
  )
);

drop policy if exists "auto_ad_images_insert_own" on public.auto_ad_images;
create policy "auto_ad_images_insert_own" on public.auto_ad_images
for insert to authenticated
with check (
  exists (
    select 1 from public.auto_ads a
    where a.id = auto_ad_images.ad_id and a.user_id = auth.uid()
  )
);

drop policy if exists "auto_ad_images_delete_own" on public.auto_ad_images;
create policy "auto_ad_images_delete_own" on public.auto_ad_images
for delete to authenticated
using (
  exists (
    select 1 from public.auto_ads a
    where a.id = auto_ad_images.ad_id and a.user_id = auth.uid()
  )
);

-- ============================================================
-- FAVORITES
-- ============================================================
create table if not exists public.auto_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ad_id uuid not null references public.auto_ads(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, ad_id)
);

create index if not exists idx_auto_fav_user on public.auto_favorites(user_id);
create index if not exists idx_auto_fav_ad on public.auto_favorites(ad_id);

alter table public.auto_favorites enable row level security;

drop policy if exists "auto_favorites_select_own" on public.auto_favorites;
create policy "auto_favorites_select_own" on public.auto_favorites
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "auto_favorites_write_own" on public.auto_favorites;
create policy "auto_favorites_write_own" on public.auto_favorites
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ============================================================
-- PRICE HISTORY
-- ============================================================
create table if not exists public.auto_price_history (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.auto_ads(id) on delete cascade,
  at timestamptz not null default now(),
  price numeric not null,
  currency text default 'UZS'
);

create index if not exists idx_auto_price_hist_ad on public.auto_price_history(ad_id);
create index if not exists idx_auto_price_hist_at on public.auto_price_history(at);

alter table public.auto_price_history enable row level security;

drop policy if exists "auto_price_history_select" on public.auto_price_history;
create policy "auto_price_history_select" on public.auto_price_history
for select
using (
  exists (
    select 1 from public.auto_ads a
    where a.id = auto_price_history.ad_id
      and (a.status = 'active' or (auth.role() = 'authenticated' and a.user_id = auth.uid()))
  )
);

drop policy if exists "auto_price_history_insert_own" on public.auto_price_history;
create policy "auto_price_history_insert_own" on public.auto_price_history
for insert to authenticated
with check (
  exists (select 1 from public.auto_ads a where a.id = auto_price_history.ad_id and a.user_id = auth.uid())
);

-- ============================================================
-- GARAJ (saved cars + price drop notify)
-- ============================================================
create table if not exists public.auto_garaj (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ad_id uuid not null references public.auto_ads(id) on delete cascade,
  brand text,
  model text,
  year int,
  price_at_add numeric,
  current_price numeric,
  currency text default 'UZS',
  image_url text,
  notify_price_drop boolean default true,
  added_at timestamptz default now(),
  unique(user_id, ad_id)
);

create index if not exists idx_auto_garaj_user on public.auto_garaj(user_id);

alter table public.auto_garaj enable row level security;

drop policy if exists "auto_garaj_select_own" on public.auto_garaj;
create policy "auto_garaj_select_own" on public.auto_garaj
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "auto_garaj_write_own" on public.auto_garaj;
create policy "auto_garaj_write_own" on public.auto_garaj
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ============================================================
-- REPORTS (shikoyat)
-- ============================================================
create table if not exists public.auto_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  ad_id uuid not null references public.auto_ads(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open','reviewing','closed')),
  created_at timestamptz default now()
);

create index if not exists idx_auto_reports_ad on public.auto_reports(ad_id);
create index if not exists idx_auto_reports_status on public.auto_reports(status);

alter table public.auto_reports enable row level security;

drop policy if exists "auto_reports_insert" on public.auto_reports;
create policy "auto_reports_insert" on public.auto_reports
for insert to authenticated
with check (reporter_id = auth.uid());

drop policy if exists "auto_reports_select_own" on public.auto_reports;
create policy "auto_reports_select_own" on public.auto_reports
for select to authenticated
using (reporter_id = auth.uid());

-- ============================================================
-- SERVICE BOOKS (rasxod daftar)
-- ============================================================
create table if not exists public.auto_service_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  car_label text,
  current_mileage int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_auto_svc_books_user on public.auto_service_books(user_id);
alter table public.auto_service_books enable row level security;

drop policy if exists "auto_svc_books_select_own" on public.auto_service_books;
create policy "auto_svc_books_select_own" on public.auto_service_books
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "auto_svc_books_write_own" on public.auto_service_books;
create policy "auto_svc_books_write_own" on public.auto_service_books
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create table if not exists public.auto_service_records (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.auto_service_books(id) on delete cascade,
  kind text,
  title text,
  cost_uzs numeric,
  current_mileage int,
  note text,
  created_at timestamptz default now()
);

create index if not exists idx_auto_svc_records_book on public.auto_service_records(book_id);
alter table public.auto_service_records enable row level security;

drop policy if exists "auto_svc_records_select_own" on public.auto_service_records;
create policy "auto_svc_records_select_own" on public.auto_service_records
for select to authenticated
using (
  exists (select 1 from public.auto_service_books b where b.id = auto_service_records.book_id and b.user_id = auth.uid())
);

drop policy if exists "auto_svc_records_write_own" on public.auto_service_records;
create policy "auto_svc_records_write_own" on public.auto_service_records
for all to authenticated
using (
  exists (select 1 from public.auto_service_books b where b.id = auto_service_records.book_id and b.user_id = auth.uid())
)
with check (
  exists (select 1 from public.auto_service_books b where b.id = auto_service_records.book_id and b.user_id = auth.uid())
);

-- ============================================================
-- Views increment RPC
-- ============================================================
create or replace function public.auto_market_inc_view(p_ad_id uuid)
returns void
language plpgsql
as $$
begin
  update public.auto_ads
  set views = views + 1,
      updated_at = now()
  where id = p_ad_id;
end;
$$;

-- ============================================================
-- Storage bucket (manual): auto-market
-- Supabase dashboard -> Storage -> Create bucket: auto-market (public)
-- ============================================================

-- ============================================================
-- OPTIONAL TABLES (keyingi bosqichlar)
-- Bu jadval va policy'lar UI tayyor bo'lganda ishlatiladi.
-- Hozirgi kod mock fallback orqali ishlashda davom etadi.
-- ============================================================

-- PROMOTIONS (TOP/REKLAMA)
create table if not exists public.auto_promotions (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.auto_ads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('top','banner','story')),
  price_uzs numeric not null,
  starts_at timestamptz default now(),
  ends_at timestamptz,
  status text not null default 'pending' check (status in ('pending','paid','active','expired','canceled')),
  meta jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_auto_promotions_ad on public.auto_promotions(ad_id);
alter table public.auto_promotions enable row level security;

-- faqat o'zi ko'radi
drop policy if exists "auto_promotions_select_own" on public.auto_promotions;
create policy "auto_promotions_select_own" on public.auto_promotions
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "auto_promotions_insert_own" on public.auto_promotions;
create policy "auto_promotions_insert_own" on public.auto_promotions
for insert to authenticated
with check (user_id = auth.uid());

-- PAYMENTS (tashqi to'lov gateway bilan bog'lash uchun)
create table if not exists public.auto_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null, -- payme/click/uzum/etc
  amount_uzs numeric not null,
  status text not null default 'created' check (status in ('created','pending','paid','failed','canceled')),
  reference_id text,
  meta jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_auto_payments_user on public.auto_payments(user_id);
alter table public.auto_payments enable row level security;
drop policy if exists "auto_payments_select_own" on public.auto_payments;
create policy "auto_payments_select_own" on public.auto_payments
for select to authenticated
using (user_id = auth.uid());
drop policy if exists "auto_payments_write_own" on public.auto_payments;
create policy "auto_payments_write_own" on public.auto_payments
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- CHATS (sotuvchi-buyer chat)
create table if not exists public.auto_chats (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.auto_ads(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz,
  created_at timestamptz default now(),
  unique(ad_id, buyer_id)
);

create table if not exists public.auto_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.auto_chats(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

alter table public.auto_chats enable row level security;
alter table public.auto_messages enable row level security;

drop policy if exists "auto_chats_select_participant" on public.auto_chats;
create policy "auto_chats_select_participant" on public.auto_chats
for select to authenticated
using (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists "auto_chats_write_participant" on public.auto_chats;
create policy "auto_chats_write_participant" on public.auto_chats
for all to authenticated
using (buyer_id = auth.uid() or seller_id = auth.uid())
with check (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists "auto_messages_select_participant" on public.auto_messages;
create policy "auto_messages_select_participant" on public.auto_messages
for select to authenticated
using (
  exists (select 1 from public.auto_chats c where c.id = auto_messages.chat_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid()))
);

drop policy if exists "auto_messages_insert_participant" on public.auto_messages;
create policy "auto_messages_insert_participant" on public.auto_messages
for insert to authenticated
with check (
  sender_id = auth.uid() and
  exists (select 1 from public.auto_chats c where c.id = auto_messages.chat_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid()))
);
