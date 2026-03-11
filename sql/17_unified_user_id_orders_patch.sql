begin;

-- 1) Keep a single universal identity across the platform.
-- orders.user_id becomes the canonical user identity for the passenger/client.
alter table public.orders
add column if not exists user_id uuid references public.profiles(id) on delete cascade;

-- 2) Backfill old records from client_id.
update public.orders
set user_id = client_id
where user_id is null
  and client_id is not null;

-- 3) Make sure new rows always keep both fields in sync during the transition period.
create or replace function public.sync_orders_user_identity()
returns trigger
language plpgsql
as $$
begin
  -- If only one side is provided, fill the other side.
  if new.user_id is null and new.client_id is not null then
    new.user_id := new.client_id;
  end if;

  if new.client_id is null and new.user_id is not null then
    new.client_id := new.user_id;
  end if;

  -- If both are present but different, force a single source of truth.
  if new.user_id is not null and new.client_id is not null and new.user_id <> new.client_id then
    new.client_id := new.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_orders_sync_user_identity on public.orders;
create trigger trg_orders_sync_user_identity
before insert or update on public.orders
for each row execute function public.sync_orders_user_identity();

-- 4) Ensure user_id is filled after sync.
update public.orders
set user_id = client_id
where user_id is null
  and client_id is not null;

-- 5) Helpful indexes for the new canonical identity.
create index if not exists idx_orders_user_id on public.orders(user_id, created_at desc);

comment on column public.orders.user_id is
'Canonical universal user identity (auth.users.id -> profiles.id). During transition it is kept in sync with client_id.';

commit;
