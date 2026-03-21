import { createClient } from "@supabase/supabase-js";
import { ChatMessage, ChatRoom } from "./chat.types";
import { QUICK_REPLIES } from "./quick-replies.data";
import { v4 as uuid } from "uuid";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const WS_URL = process.env.WS_GATEWAY_URL || "http://ws-gateway:3010";

export class ChatService {

  async createRoom(orderId: string, clientId: string, driverId: string): Promise<ChatRoom> {
    const { data, error } = await sb.from("chat_rooms").upsert({
      id: orderId, order_id: orderId, client_id: clientId,
      driver_id: driverId, status: "active",
      unread_client: 0, unread_driver: 0,
      created_at: new Date().toISOString(),
    }, { onConflict: "id" }).select().single();
    if (error) throw error;
    return data as ChatRoom;
  }

  async sendMessage(
    roomId:     string,
    senderId:   string,
    senderRole: ChatMessage["sender_role"],
    content:    string,
    type:       ChatMessage["type"] = "text",
    mediaUrl?:  string
  ): Promise<ChatMessage> {
    const msg: Omit<ChatMessage,"id"> = {
      room_id: roomId, sender_id: senderId, sender_role: senderRole,
      type, content, media_url: mediaUrl,
      is_read: false, created_at: new Date().toISOString(),
    };

    const { data, error } = await sb.from("chat_messages")
      .insert({ id: uuid(), ...msg }).select().single();
    if (error) throw error;

    // Update room last_msg + unread
    const unreadField = senderRole === "driver" ? "unread_client" : "unread_driver";
    await sb.from("chat_rooms").update({
      last_msg:     content.slice(0, 100),
      [unreadField]: sb.rpc("increment_field", { id: roomId, field: unreadField }),
    }).eq("id", roomId);

    // Push to WebSocket
    await fetch(`${WS_URL}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ event: "chat:message", room: roomId, data: { id: uuid(), ...msg } }),
    }).catch(() => null);

    return data as ChatMessage;
  }

  async getMessages(roomId: string, limit = 50, before?: string): Promise<ChatMessage[]> {
    let q = sb.from("chat_messages")
      .select("*").eq("room_id", roomId)
      .order("created_at", { ascending: false }).limit(limit);
    if (before) q = q.lt("created_at", before);
    const { data } = await q;
    return ((data || []) as ChatMessage[]).reverse();
  }

  async markRead(roomId: string, readerRole: "client" | "driver"): Promise<void> {
    await sb.from("chat_messages")
      .update({ is_read: true })
      .eq("room_id", roomId)
      .neq("sender_role", readerRole)
      .eq("is_read", false);
    const field = readerRole === "client" ? "unread_client" : "unread_driver";
    await sb.from("chat_rooms").update({ [field]: 0 }).eq("id", roomId);
  }

  async closeRoom(roomId: string): Promise<void> {
    await sb.from("chat_rooms")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", roomId);
  }

  async getRoom(roomId: string): Promise<ChatRoom | null> {
    const { data } = await sb.from("chat_rooms").select("*").eq("id", roomId).single();
    return data as ChatRoom | null;
  }

  getQuickReplies(role: "client" | "driver", lang = "uz") {
    return QUICK_REPLIES
      .filter(r => r.role === role || r.role === "both")
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(r => ({
        id:   r.id,
        text: lang === "ru" ? r.text_ru : lang === "en" ? r.text_en : r.text_uz,
      }));
  }

  async reportMessage(messageId: string, reporterId: string, reason: string): Promise<void> {
    await sb.from("chat_reports").insert({
      message_id: messageId, reporter_id: reporterId,
      reason, created_at: new Date().toISOString(),
    });
  }
}
