begin;

-- Final production migration for a single universal user identity on orders.

update public.orders
set user_id = coalesce(user_id, client_id)
where user_id is null
  and client_id is not null;

alter table public.orders
alter column user_id set not null;

drop trigger if exists trg_orders_sync_user_identity on public.orders;
drop function if exists public.sync_orders_user_identity();

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
drop policy if exists "orders_update_own_or_assigned" on public.orders;

drop index if exists public.idx_orders_client;
drop index if exists public.idx_orders_client_active;

alter table public.orders
drop column if exists client_id;

create policy "orders_select_own_or_assigned"
on public.orders
for select
to authenticated
using ((user_id = auth.uid()) or (driver_id = auth.uid()));

create policy "orders_insert_own"
on public.orders
for insert
to authenticated
with check (user_id = auth.uid());

create policy "orders_update_own_or_assigned"
on public.orders
for update
to authenticated
using ((user_id = auth.uid()) or (driver_id = auth.uid()))
with check ((user_id = auth.uid()) or (driver_id = auth.uid()));

create policy "orders_delete_own"
on public.orders
for delete
to authenticated
using (user_id = auth.uid());

comment on column public.orders.user_id is
'Canonical universal user identity for order owner. client_id removed.';

commit;
