import { createClient } from "@supabase/supabase-js";
import { v4 as uuid } from "uuid";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "critical";
export type TicketCategory =
  | "payment_issue" | "driver_complaint" | "app_bug"
  | "order_issue" | "account_help" | "safety" | "other";

export interface Ticket {
  id:           string;
  user_id:      string;
  order_id?:    string;
  category:     TicketCategory;
  priority:     TicketPriority;
  subject:      string;
  description:  string;
  status:       TicketStatus;
  assigned_to?: string;
  resolution?:  string;
  messages:     TicketMessage[];
  created_at:   string;
  updated_at:   string;
  resolved_at?: string;
}

export interface TicketMessage {
  id:          string;
  ticket_id:   string;
  sender_id:   string;
  sender_role: "user" | "agent" | "system";
  content:     string;
  created_at:  string;
}

const AUTO_RESPONSES: Record<TicketCategory, string> = {
  payment_issue:     "To'lovingiz haqida ma'lumot olyapmiz. Iltimos, 5 daqiqa kuting.",
  driver_complaint:  "Haydovchi haqida shikoyatingiz qabul qilindi. 24 soat ichida ko'rib chiqamiz.",
  app_bug:           "Ilova xatosi qayd etildi. Texnik guruhimiz ko'rib chiqmoqda.",
  order_issue:       "Buyurtmangiz bo'yicha ma'lumot tekshirilmoqda.",
  account_help:      "Hisobingiz bo'yicha yordam berishga tayyormiz.",
  safety:            "Xavfsizlik shikoyatingiz USTUVOR sifatida ko'rilmoqda!",
  other:             "Murojaatingiz qabul qilindi. Tez orada javob beramiz.",
};

function getAutoAssignPriority(category: TicketCategory): TicketPriority {
  if (category === "safety" || category === "payment_issue") return "critical";
  if (category === "order_issue" || category === "driver_complaint") return "high";
  if (category === "app_bug") return "medium";
  return "low";
}

export class SupportService {

  async createTicket(
    userId:      string,
    category:    TicketCategory,
    subject:     string,
    description: string,
    orderId?:    string
  ): Promise<Ticket> {
    const priority = getAutoAssignPriority(category);
    const now      = new Date().toISOString();
    const ticketId = uuid();

    const { data: ticket, error } = await sb.from("support_tickets").insert({
      id: ticketId, user_id: userId, order_id: orderId,
      category, priority, subject, description,
      status: "open", created_at: now, updated_at: now,
    }).select().single();
    if (error) throw error;

    // Auto-response message
    await sb.from("ticket_messages").insert({
      id: uuid(), ticket_id: ticketId,
      sender_id: "system", sender_role: "system",
      content: AUTO_RESPONSES[category],
      created_at: now,
    });

    // Notify user via in-app
    await fetch(
      `${process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3006"}/notify/in-app`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          user_id: userId,
          title:   "Murojaatingiz qabul qilindi",
          body:    `#${ticketId.slice(-6)} — ${subject}`,
          type:    "system",
          metadata:{ ticket_id: ticketId },
        }),
      }
    ).catch(() => null);

    return { ...(ticket as any), messages: [] };
  }

  async addMessage(
    ticketId:   string,
    senderId:   string,
    senderRole: TicketMessage["sender_role"],
    content:    string
  ): Promise<TicketMessage> {
    const { data, error } = await sb.from("ticket_messages").insert({
      id: uuid(), ticket_id: ticketId,
      sender_id: senderId, sender_role: senderRole,
      content, created_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;

    await sb.from("support_tickets").update({
      updated_at: new Date().toISOString(),
      status: senderRole === "agent" ? "in_progress" : undefined,
    }).eq("id", ticketId);

    return data as TicketMessage;
  }

  async resolveTicket(ticketId: string, agentId: string, resolution: string): Promise<void> {
    const now = new Date().toISOString();
    await sb.from("support_tickets").update({
      status: "resolved", resolution,
      assigned_to: agentId, resolved_at: now, updated_at: now,
    }).eq("id", ticketId);

    await this.addMessage(ticketId, agentId, "agent",
      `✅ Murojaat yechildi: ${resolution}`);
  }

  async getTicket(ticketId: string): Promise<Ticket | null> {
    const [ticket, messages] = await Promise.all([
      sb.from("support_tickets").select("*").eq("id", ticketId).single(),
      sb.from("ticket_messages").select("*").eq("ticket_id", ticketId)
        .order("created_at"),
    ]);
    if (!ticket.data) return null;
    return { ...(ticket.data as any), messages: messages.data || [] };
  }

  async getUserTickets(userId: string): Promise<Ticket[]> {
    const { data } = await sb.from("support_tickets")
      .select("*").eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(20);
    return (data || []) as Ticket[];
  }

  async getOpenTickets(limit = 50): Promise<Ticket[]> {
    const { data } = await sb.from("support_tickets")
      .select("*").in("status", ["open", "in_progress"])
      .order("priority").order("created_at").limit(limit);
    return (data || []) as Ticket[];
  }

  async assignTicket(ticketId: string, agentId: string): Promise<void> {
    await sb.from("support_tickets").update({
      assigned_to: agentId, status: "in_progress",
      updated_at: new Date().toISOString(),
    }).eq("id", ticketId);
  }

  async getStats() {
    const [open, inProgress, resolved, critical] = await Promise.all([
      sb.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
      sb.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
      sb.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "resolved"),
      sb.from("support_tickets").select("id", { count: "exact", head: true }).eq("priority", "critical").eq("status", "open"),
    ]);
    return {
      open:     open.count || 0,
      in_progress: inProgress.count || 0,
      resolved: resolved.count || 0,
      critical_open: critical.count || 0,
    };
  }
}
