-- sql/support_chat.sql
-- Order-linked support chat (SAFE additive)

begin;

create table if not exists public.support_threads (
  id uuid primary key default gen_random_uuid(),
  order_id uuid null,
  user_id uuid null,
  driver_id uuid null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_threads_order_idx on public.support_threads(order_id);
create index if not exists support_threads_user_idx on public.support_threads(user_id);
create index if not exists support_threads_driver_idx on public.support_threads(driver_id);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads(id) on delete cascade,
  sender_role text not null, -- 'client' | 'driver' | 'admin'
  sender_id uuid null,
  message text not null,
  meta jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists support_messages_thread_idx on public.support_messages(thread_id);
create index if not exists support_messages_created_idx on public.support_messages(created_at);

commit;
