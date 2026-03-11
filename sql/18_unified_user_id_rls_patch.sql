begin;

alter table public.orders enable row level security;

-- Drop old orders policies so we can recreate them against the universal identity.
drop policy if exists "orders_select_own_or_assigned" on public.orders;
drop policy if exists "orders_insert_client" on public.orders;
drop policy if exists "orders_update_client_limited" on public.orders;
drop policy if exists "orders_insert_own" on public.orders;
drop policy if exists "orders_update_own" on public.orders;

-- SELECT: the order owner (user_id) or assigned driver can read it.
create policy "orders_select_own_or_assigned"
on public.orders
for select
to authenticated
using ((user_id = auth.uid()) or (driver_id = auth.uid()));

-- INSERT: the authenticated user may only create their own order.
create policy "orders_insert_own"
on public.orders
for insert
to authenticated
with check (user_id = auth.uid());

-- UPDATE: the authenticated user may only update their own order.
create policy "orders_update_own"
on public.orders
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

commit;
