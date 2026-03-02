-- Push tokens table (FCM)
create table if not exists push_tokens (
  id bigserial primary key,
  user_id uuid not null,
  role text not null,
  device_id text,
  platform text,
  app_version text,
  fcm_token text not null,
  updated_at timestamptz not null default now(),
  unique (user_id, role, device_id)
);

create index if not exists push_tokens_user_role_idx on push_tokens(user_id, role);