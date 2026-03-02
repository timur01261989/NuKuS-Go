-- cancel_policies: configurable fees/penalties (optional)
create table if not exists cancel_policies (
  id bigserial primary key,
  role text not null, -- driver|client
  reason_code text not null,
  penalty_points int not null default 0,
  fee_amount numeric not null default 0,
  is_active boolean not null default true,
  unique(role, reason_code)
);