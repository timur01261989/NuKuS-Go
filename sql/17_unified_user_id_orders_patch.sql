begin;

-- Canonical ownership for orders is public.orders.user_id.
-- This migration permanently removes legacy client_id from the orders table.

update public.orders
set user_id = coalesce(user_id, client_id)
where user_id is null
  and client_id is not null;

alter table public.orders
alter column user_id set not null;

drop trigger if exists trg_orders_sync_user_identity on public.orders;
drop function if exists public.sync_orders_user_identity();

drop index if exists public.idx_orders_client;
drop index if exists public.idx_orders_client_active;

alter table public.orders
drop column if exists client_id;

comment on column public.orders.user_id is
'Canonical universal user identity for order owner. client_id has been removed.';

commit;
