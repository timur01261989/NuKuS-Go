-- Chat system
CREATE TABLE IF NOT EXISTS chat_rooms (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID REFERENCES orders(id),
  client_id      UUID REFERENCES profiles(id),
  driver_id      UUID,
  status         TEXT DEFAULT 'active',
  last_msg       TEXT,
  unread_client  INTEGER DEFAULT 0,
  unread_driver  INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  closed_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id    UUID,
  sender_role  TEXT,
  type         TEXT DEFAULT 'text',
  content      TEXT NOT NULL,
  media_url    TEXT,
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id, created_at DESC);
