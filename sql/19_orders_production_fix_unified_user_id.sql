-- UniGo production fix
-- Maqsad:
-- 1) orders jadvalini client_id + user_id yagona oqimda ushlash
-- 2) eski null yozuvlarni backfill qilish
-- 3) ortiqcha policylarni tozalash
-- 4) authenticated/service oqimini barqaror qilish

begin;

alter table public.orders add column if not exists user_id uuid;
alter table public.orders add column if not exists client_id uuid;

update public.orders
set user_id = coalesce(user_id, client_id)
where user_id is null
  and client_id is not null;

update public.orders
set client_id = coalesce(client_id, user_id)
where client_id is null
  and user_id is not null;

-- Agar ikkisi ham to'ldirilgan bo'lsa lekin farq qilsa, unified user_id oqimi uchun client_id ni asos qilamiz.
update public.orders
set user_id = client_id
where client_id is not null
  and user_id is not null
  and user_id <> client_id;

alter table public.orders
  drop constraint if exists orders_user_id_fkey;

alter table public.orders
  drop constraint if exists orders_client_id_fkey;

alter table public.orders
  add constraint orders_user_id_fkey
  foreign key (user_id)
  references auth.users(id)
  on delete cascade;

alter table public.orders
  add constraint orders_client_id_fkey
  foreign key (client_id)
  references auth.users(id)
  on delete cascade;

create index if not exists idx_orders_user_id_created_at
  on public.orders(user_id, created_at desc);

create index if not exists idx_orders_client_id_created_at
  on public.orders(client_id, created_at desc);

create index if not exists idx_orders_driver_id_created_at
  on public.orders(driver_id, created_at desc);

create index if not exists idx_orders_status_created_at
  on public.orders(status, created_at desc);

alter table public.orders enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.orders to authenticated;

drop policy if exists "orders_select_own" on public.orders;
drop policy if exists "orders_insert_own" on public.orders;
drop policy if exists "orders_update_own" on public.orders;
drop policy if exists "orders_delete_own" on public.orders;
drop policy if exists "orders_select_own_or_assigned" on public.orders;
drop policy if exists "orders_insert_client" on public.orders;
drop policy if exists "orders_update_client_limited" on public.orders;
drop policy if exists "orders_select_client_or_driver" on public.orders;
drop policy if exists "orders_update_client_or_driver" on public.orders;
drop policy if exists "orders_delete_client" on public.orders;

create policy "orders_select_client_or_driver"
on public.orders
for select
to authenticated
using (
  auth.uid() = client_id
  or auth.uid() = user_id
  or auth.uid() = driver_id
);

create policy "orders_insert_client"
on public.orders
for insert
to authenticated
with check (
  auth.uid() = client_id
  and auth.uid() = user_id
);

create policy "orders_update_client_or_driver"
on public.orders
for update
to authenticated
using (
  auth.uid() = client_id
  or auth.uid() = user_id
  or auth.uid() = driver_id
)
with check (
  auth.uid() = client_id
  or auth.uid() = user_id
  or auth.uid() = driver_id
);

create policy "orders_delete_client"
on public.orders
for delete
to authenticated
using (
  auth.uid() = client_id
  or auth.uid() = user_id
);

commit;
