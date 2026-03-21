export interface ChatMessage {
  id:         string;
  room_id:    string;   // orderId
  sender_id:  string;
  sender_role:"client" | "driver" | "support";
  type:       "text" | "image" | "template" | "location";
  content:    string;
  media_url?: string;
  is_read:    boolean;
  created_at: string;
}

export interface ChatRoom {
  id:         string;  // same as order_id
  order_id:   string;
  client_id:  string;
  driver_id:  string;
  status:     "active" | "closed" | "archived";
  last_msg?:  string;
  unread_client: number;
  unread_driver: number;
  created_at: string;
  closed_at?: string;
}

export interface QuickReply {
  id:         string;
  text_uz:    string;
  text_ru:    string;
  text_en:    string;
  role:       "client" | "driver" | "both";
  order?:     number;
}
