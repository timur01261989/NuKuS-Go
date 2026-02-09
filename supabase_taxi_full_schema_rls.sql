-- Nukus Go - Taxi/Chat/Presence/Dispatch - Full schema additions + STRICT RLS (recommended for production)
-- Prereq: Supabase Auth enabled. Uses auth.uid().

alter table if exists orders
  add column if not exists service_type text default 'standard',
  add column if not exists estimated_price_uzs bigint,
  add column if not exists final_price_uzs bigint,
  add column if not exists distance_km double precision,
  add column if not exists duration_min double precision,
  add column if not exists cancel_reason text,
  add column if not exists cancelled_by text,
  add column if not exists accepted_at timestamptz,
  add column if not exists arrived_at timestamptz,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists cancelled_at timestamptz;

create table if not exists driver_presence (
  driver_user_id uuid primary key references users(id) on delete cascade,
  is_online boolean not null default false,
  lat double precision,
  lng double precision,
  bearing double precision,
  updated_at timestamptz not null default now()
);
create index if not exists idx_driver_presence_online on driver_presence(is_online);
create index if not exists idx_driver_presence_updated on driver_presence(updated_at desc);

create table if not exists order_offers (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  driver_user_id uuid not null references users(id) on delete cascade,
  status text not null default 'sent', -- sent/accepted/rejected/timeout
  sent_at timestamptz not null default now(),
  responded_at timestamptz,
  expires_at timestamptz,
  unique(order_id, driver_user_id)
);
create index if not exists idx_offers_order on order_offers(order_id);
create index if not exists idx_offers_driver on order_offers(driver_user_id);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  sender_user_id uuid not null references users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_order on messages(order_id, created_at desc);

create table if not exists sos_tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete set null,
  user_id uuid not null references users(id) on delete cascade,
  message text,
  lat double precision,
  lng double precision,
  status text not null default 'open', -- open/closed
  created_at timestamptz not null default now()
);
create index if not exists idx_sos_created on sos_tickets(created_at desc);

alter table orders enable row level security;
alter table driver_locations enable row level security;
alter table driver_presence enable row level security;
alter table order_offers enable row level security;
alter table messages enable row level security;
alter table sos_tickets enable row level security;

-- ORDERS
drop policy if exists orders_select_own on orders;
create policy orders_select_own on orders
for select using (client_user_id = auth.uid() or driver_user_id = auth.uid());

drop policy if exists orders_insert_client on orders;
create policy orders_insert_client on orders
for insert with check (client_user_id = auth.uid());

drop policy if exists orders_update_own on orders;
create policy orders_update_own on orders
for update using (client_user_id = auth.uid() or driver_user_id = auth.uid());

-- DRIVER_LOCATIONS
drop policy if exists driverloc_insert_driver on driver_locations;
create policy driverloc_insert_driver on driver_locations
for insert with check (driver_user_id = auth.uid());

drop policy if exists driverloc_update_driver on driver_locations;
create policy driverloc_update_driver on driver_locations
for update using (driver_user_id = auth.uid());

drop policy if exists driverloc_select_related on driver_locations;
create policy driverloc_select_related on driver_locations
for select using (
  exists(select 1 from orders o where o.id = driver_locations.order_id and (o.client_user_id = auth.uid() or o.driver_user_id = auth.uid()))
);

-- DRIVER_PRESENCE
drop policy if exists presence_upsert_driver on driver_presence;
create policy presence_upsert_driver on driver_presence for insert with check (driver_user_id = auth.uid());
drop policy if exists presence_update_driver on driver_presence;
create policy presence_update_driver on driver_presence for update using (driver_user_id = auth.uid());
drop policy if exists presence_select_online on driver_presence;
create policy presence_select_online on driver_presence for select using (is_online = true);

-- OFFERS
drop policy if exists offers_select_related on order_offers;
create policy offers_select_related on order_offers
for select using (
  driver_user_id = auth.uid()
  or exists(select 1 from orders o where o.id = order_offers.order_id and o.client_user_id = auth.uid())
);
drop policy if exists offers_update_driver on order_offers;
create policy offers_update_driver on order_offers for update using (driver_user_id = auth.uid());

-- MESSAGES
drop policy if exists messages_select_related on messages;
create policy messages_select_related on messages
for select using (
  exists(select 1 from orders o where o.id = messages.order_id and (o.client_user_id = auth.uid() or o.driver_user_id = auth.uid()))
);
drop policy if exists messages_insert_sender on messages;
create policy messages_insert_sender on messages
for insert with check (
  sender_user_id = auth.uid()
  and exists(select 1 from orders o where o.id = messages.order_id and (o.client_user_id = auth.uid() or o.driver_user_id = auth.uid()))
);

-- SOS
drop policy if exists sos_insert_own on sos_tickets;
create policy sos_insert_own on sos_tickets for insert with check (user_id = auth.uid());
drop policy if exists sos_select_own on sos_tickets;
create policy sos_select_own on sos_tickets for select using (user_id = auth.uid());
