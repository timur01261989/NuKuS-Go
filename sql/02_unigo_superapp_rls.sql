begin;

alter table public.profiles enable row level security;
alter table public.driver_applications enable row level security;
alter table public.drivers enable row level security;
alter table public.driver_presence enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.billing_transactions enable row level security;
alter table public.orders enable row level security;
alter table public.order_offers enable row level security;
alter table public.order_events enable row level security;
alter table public.order_status_history enable row level security;
alter table public.auto_market_ads enable row level security;
alter table public.auto_market_images enable row level security;
alter table public.auto_market_favorites enable row level security;
alter table public.auto_market_payments enable row level security;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists driver_applications_select_own on public.driver_applications;
drop policy if exists driver_applications_insert_own on public.driver_applications;
drop policy if exists driver_applications_update_own_pending on public.driver_applications;
drop policy if exists drivers_select_self on public.drivers;
drop policy if exists driver_presence_select_self on public.driver_presence;
drop policy if exists driver_presence_insert_self on public.driver_presence;
drop policy if exists driver_presence_update_self on public.driver_presence;
drop policy if exists wallets_select_own on public.wallets;
drop policy if exists wallet_transactions_select_own on public.wallet_transactions;
drop policy if exists billing_transactions_select_own on public.billing_transactions;
drop policy if exists orders_select_own_or_assigned on public.orders;
drop policy if exists orders_insert_client on public.orders;
drop policy if exists orders_update_client_limited on public.orders;
drop policy if exists order_offers_select_driver on public.order_offers;
drop policy if exists order_events_select_participant on public.order_events;
drop policy if exists order_status_history_select_participant on public.order_status_history;
drop policy if exists auto_market_ads_select_public on public.auto_market_ads;
drop policy if exists auto_market_ads_insert_own on public.auto_market_ads;
drop policy if exists auto_market_ads_update_own on public.auto_market_ads;
drop policy if exists auto_market_images_select_public on public.auto_market_images;
drop policy if exists auto_market_images_insert_own on public.auto_market_images;
drop policy if exists auto_market_images_delete_own on public.auto_market_images;
drop policy if exists auto_market_favorites_select_own on public.auto_market_favorites;
drop policy if exists auto_market_favorites_write_own on public.auto_market_favorites;
drop policy if exists auto_market_payments_select_own on public.auto_market_payments;

-- profiles
create policy profiles_select_own on public.profiles
for select to authenticated
using (id = auth.uid());

create policy profiles_update_own on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- driver_applications
create policy driver_applications_select_own on public.driver_applications
for select to authenticated
using (user_id = auth.uid());

create policy driver_applications_insert_own on public.driver_applications
for insert to authenticated
with check (user_id = auth.uid());

create policy driver_applications_update_own_pending on public.driver_applications
for update to authenticated
using (user_id = auth.uid() and status = 'pending')
with check (user_id = auth.uid());

-- drivers
create policy drivers_select_self on public.drivers
for select to authenticated
using (user_id = auth.uid());

-- driver_presence
create policy driver_presence_select_self on public.driver_presence
for select to authenticated
using (driver_id = auth.uid());

create policy driver_presence_insert_self on public.driver_presence
for insert to authenticated
with check (driver_id = auth.uid());

create policy driver_presence_update_self on public.driver_presence
for update to authenticated
using (driver_id = auth.uid())
with check (driver_id = auth.uid());

-- wallets
create policy wallets_select_own on public.wallets
for select to authenticated
using (user_id = auth.uid());

-- wallet_transactions
create policy wallet_transactions_select_own on public.wallet_transactions
for select to authenticated
using (user_id = auth.uid());

-- billing_transactions
create policy billing_transactions_select_own on public.billing_transactions
for select to authenticated
using (user_id = auth.uid());

-- orders
create policy orders_select_own_or_assigned on public.orders
for select to authenticated
using (client_id = auth.uid() or driver_id = auth.uid());

create policy orders_insert_client on public.orders
for insert to authenticated
with check (client_id = auth.uid());

create policy orders_update_client_limited on public.orders
for update to authenticated
using (client_id = auth.uid())
with check (client_id = auth.uid());

-- order_offers
create policy order_offers_select_driver on public.order_offers
for select to authenticated
using (driver_id = auth.uid());

-- order_events
create policy order_events_select_participant on public.order_events
for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_events.order_id
      and (o.client_id = auth.uid() or o.driver_id = auth.uid())
  )
);

-- order_status_history
create policy order_status_history_select_participant on public.order_status_history
for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_status_history.order_id
      and (o.client_id = auth.uid() or o.driver_id = auth.uid())
  )
);

-- auto market ads
create policy auto_market_ads_select_public on public.auto_market_ads
for select
using (
  status = 'active' or owner_user_id = auth.uid()
);

create policy auto_market_ads_insert_own on public.auto_market_ads
for insert to authenticated
with check (owner_user_id = auth.uid());

create policy auto_market_ads_update_own on public.auto_market_ads
for update to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

-- auto market images
create policy auto_market_images_select_public on public.auto_market_images
for select
using (
  exists (
    select 1 from public.auto_market_ads a
    where a.id = auto_market_images.ad_id
      and (a.status = 'active' or a.owner_user_id = auth.uid())
  )
);

create policy auto_market_images_insert_own on public.auto_market_images
for insert to authenticated
with check (
  exists (
    select 1 from public.auto_market_ads a
    where a.id = auto_market_images.ad_id
      and a.owner_user_id = auth.uid()
  )
);

create policy auto_market_images_delete_own on public.auto_market_images
for delete to authenticated
using (
  exists (
    select 1 from public.auto_market_ads a
    where a.id = auto_market_images.ad_id
      and a.owner_user_id = auth.uid()
  )
);

-- auto market favorites
create policy auto_market_favorites_select_own on public.auto_market_favorites
for select to authenticated
using (user_id = auth.uid());

create policy auto_market_favorites_write_own on public.auto_market_favorites
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- auto market payments
create policy auto_market_payments_select_own on public.auto_market_payments
for select to authenticated
using (user_id = auth.uid());

commit;
