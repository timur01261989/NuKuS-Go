-- Phase 7: order offers + timeline hardening
create index if not exists idx_order_offers_order_sent_expires
on public.order_offers(order_id, status, expires_at desc);

create index if not exists idx_order_offers_driver_sent
on public.order_offers(driver_id, status, sent_at desc);

create index if not exists idx_order_events_order_code_created
on public.order_events(order_id, event_code, created_at desc);

create index if not exists idx_orders_searching_service_created
on public.orders(service_type, status, created_at desc)
where status in ('created','searching','offered');
