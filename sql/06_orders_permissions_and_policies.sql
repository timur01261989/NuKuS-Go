begin;

alter table public.orders enable row level security;

grant usage on schema public to authenticated;
grant usage on schema public to service_role;
grant usage on schema public to anon;

grant select, insert, update, delete on table public.orders to authenticated;
grant select, insert, update, delete on table public.orders to service_role;
grant select on table public.orders to anon;

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
using (client_id = auth.uid() or driver_id = auth.uid());

create policy "orders_insert_client"
on public.orders
for insert
to authenticated
with check (client_id = auth.uid());

create policy "orders_update_client_or_driver"
on public.orders
for update
to authenticated
using (client_id = auth.uid() or driver_id = auth.uid())
with check (client_id = auth.uid() or driver_id = auth.uid());

create policy "orders_delete_client"
on public.orders
for delete
to authenticated
using (client_id = auth.uid());

update public.orders
set user_id = client_id
where user_id is null and client_id is not null;

commit;
