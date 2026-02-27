-- delivery_schema.sql
-- Supabase: delivery_orders jadvali (siz bergan sxema bo‘yicha)

create table if not exists public.delivery_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),

  sender_phone text,
  receiver_phone text,
  receiver_name text,

  parcel_type text,                 -- 'document', 'keys', 'box_small', 'box_large', 'flowers'
  weight_category int,              -- 1,2,3,4 (siz xohlasangiz)
  door_to_door boolean default false,
  who_pays text default 'sender',   -- 'sender' | 'receiver'

  photos jsonb default '[]'::jsonb, -- ["url1","url2"]
  secure_code int,                 -- 4 xonali

  pickup_location jsonb,            -- {lat,lng,address,apartment,floor,entrance}
  drop_location jsonb,              -- {lat,lng,address,apartment,floor,entrance}

  comment text,
  price int,
  distance_km numeric,
  duration_min numeric,

  courier_id uuid,                  -- haydovchi/kuryer id (agar bo‘lsa)
  courier_meta jsonb default '{}'::jsonb, -- {name,phone,avatar,vehicle,bearing}

  status text default 'searching',  -- 'searching','pickup','delivering','completed','cancelled'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- updated_at trigger (ixtiyoriy)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_delivery_updated_at on public.delivery_orders;
create trigger trg_delivery_updated_at
before update on public.delivery_orders
for each row execute function public.set_updated_at();

-- Indexlar
create index if not exists idx_delivery_orders_user on public.delivery_orders(user_id, created_at desc);
create index if not exists idx_delivery_orders_status on public.delivery_orders(status, created_at desc);
