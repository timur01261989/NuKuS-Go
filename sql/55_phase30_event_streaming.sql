create table if not exists event_stream (
  id uuid primary key default gen_random_uuid(),
  stream_type text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_event_stream_type_created
on event_stream(stream_type, created_at desc);
