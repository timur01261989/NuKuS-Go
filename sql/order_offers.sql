-- order_offers: exclusive offer queue
create table if not exists order_offers (
  id bigserial primary key,
  order_id uuid not null references orders(id) on delete cascade,
  driver_id uuid not null references drivers(id) on delete cascade,
  status text not null default 'sent', -- sent|accepted|rejected|expired
  sent_at timestamptz not null default now(),
  expires_at timestamptz not null,
  responded_at timestamptz,
  rank int,
  unique(order_id, driver_id)
);

create index if not exists order_offers_order_status_idx on order_offers(order_id, status);
create index if not exists order_offers_driver_status_idx on order_offers(driver_id, status);