-- Auto in-app notifications on orders.status changes (add-only)
-- Requires notifications table from supabase_full6_features.sql

create or replace function public.notify_order_status_change()
returns trigger
language plpgsql
security definer
as $$
declare
  title text;
  body text;
begin
  if new.status is distinct from old.status then
    title := 'Buyurtma holati yangilandi';
    body := coalesce('Status: '||new.status, 'Status yangilandi');

    if new.client_user_id is not null then
      insert into public.notifications(user_id, type, title, body, data)
      values (new.client_user_id, 'order_status', title, body, jsonb_build_object('order_id', new.id, 'status', new.status));
    end if;

    if new.driver_user_id is not null then
      insert into public.notifications(user_id, type, title, body, data)
      values (new.driver_user_id, 'order_status', title, body, jsonb_build_object('order_id', new.id, 'status', new.status));
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_order_status on public.orders;
create trigger trg_notify_order_status
after update of status on public.orders
for each row execute function public.notify_order_status_change();
