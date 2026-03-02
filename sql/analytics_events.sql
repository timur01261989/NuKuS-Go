-- optional generic analytics table
create table if not exists analytics_events (
  id bigserial primary key,
  event text not null,
  props jsonb,
  created_at timestamptz not null default now()
);
create index if not exists analytics_events_event_idx on analytics_events(event, created_at desc);