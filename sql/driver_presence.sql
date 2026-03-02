-- driver_presence: single source of truth (TTL-based online)
create table if not exists driver_presence (
  driver_id uuid primary key references drivers(id) on delete cascade,
  is_online boolean not null default false,
  active_service_type text not null default 'taxi',
  state text not null default 'offline', -- offline|online|busy
  lat double precision,
  lng double precision,
  geohash text,
  bearing double precision,
  speed double precision,
  last_seen_at timestamptz not null default now(),
  device_id text,
  platform text,
  app_version text,
  updated_at timestamptz not null default now()
);

create index if not exists driver_presence_last_seen_idx on driver_presence(last_seen_at);
create index if not exists driver_presence_service_idx on driver_presence(active_service_type, is_online);