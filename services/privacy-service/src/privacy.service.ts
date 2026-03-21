import { createClient } from "@supabase/supabase-js";
import { v4 as uuid } from "uuid";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export interface DataExportRequest {
  id:          string;
  user_id:     string;
  status:      "pending" | "processing" | "ready" | "expired";
  export_url?: string;
  created_at:  string;
  expires_at?: string;
}

export interface DeletionRequest {
  id:            string;
  user_id:       string;
  reason?:       string;
  status:        "pending" | "processing" | "completed" | "rejected";
  scheduled_for: string;  // 30 days delay
  created_at:    string;
}

export class PrivacyService {

  // ── Data Export (right to portability) ─────────────────────────
  async requestDataExport(userId: string): Promise<DataExportRequest> {
    const { data: req, error } = await sb.from("data_export_requests").insert({
      id: uuid(), user_id: userId, status: "pending",
      created_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;

    // Trigger async export job
    // (In production: enqueue to BullMQ, process in background)
    this._processExport(req.id, userId).catch(console.error);

    return req as DataExportRequest;
  }

  private async _processExport(requestId: string, userId: string): Promise<void> {
    await sb.from("data_export_requests")
      .update({ status: "processing" }).eq("id", requestId);

    // Gather all user data
    const [profile, orders, payments, reviews, chats] = await Promise.all([
      sb.from("profiles").select("*").eq("id", userId).single(),
      sb.from("orders").select("*").eq("client_id", userId),
      sb.from("payments").select("*").eq("user_id", userId),
      sb.from("driver_ratings").select("*").eq("user_id", userId),
      sb.from("chat_messages").select("*").eq("sender_id", userId),
    ]);

    const exportData = {
      exported_at:  new Date().toISOString(),
      profile:      profile.data,
      orders:       orders.data || [],
      payments:     payments.data || [],
      reviews:      reviews.data || [],
      chat_messages:(chats.data || []).length + " messages",
      data_request: "Your data as of " + new Date().toLocaleDateString("uz-UZ"),
    };

    // Store export (in production: upload to S3)
    const exportJson = JSON.stringify(exportData, null, 2);
    const expiresAt  = new Date(Date.now() + 7 * 86400000).toISOString();

    await sb.from("data_export_requests").update({
      status: "ready",
      export_data: exportJson,
      expires_at: expiresAt,
    }).eq("id", requestId);
  }

  async getExport(requestId: string, userId: string): Promise<any> {
    const { data } = await sb.from("data_export_requests")
      .select("*").eq("id", requestId).eq("user_id", userId).single();
    if (!data) throw new Error("Export request not found");
    if ((data as any).status !== "ready") throw new Error("Export not ready yet");
    if (new Date((data as any).expires_at) < new Date()) throw new Error("Export link expired");
    return { ...data, export_data: JSON.parse((data as any).export_data || "{}") };
  }

  // ── Account Deletion (right to erasure) ────────────────────────
  async requestDeletion(userId: string, reason?: string): Promise<DeletionRequest> {
    const scheduledFor = new Date(Date.now() + 30 * 86400000).toISOString();

    const { data: req, error } = await sb.from("deletion_requests").insert({
      id: uuid(), user_id: userId, reason, status: "pending",
      scheduled_for: scheduledFor, created_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;

    // Notify user
    await fetch(`${process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3006"}/notify/in-app`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId, title: "Hisobni o'chirish so'rovi qabul qilindi",
        body: `Hisobingiz ${new Date(scheduledFor).toLocaleDateString("uz-UZ")} kuni o'chiriladi. 30 kun ichida bekor qilishingiz mumkin.`,
        type: "system",
      }),
    }).catch(() => null);

    return req as DeletionRequest;
  }

  async cancelDeletion(userId: string): Promise<void> {
    const { data } = await sb.from("deletion_requests")
      .select("id, status").eq("user_id", userId).eq("status", "pending").single();
    if (!data) throw new Error("Faol o'chirish so'rovi topilmadi");
    await sb.from("deletion_requests").update({ status: "rejected" }).eq("id", (data as any).id);
  }

  async executeScheduledDeletions(): Promise<number> {
    const { data: pending } = await sb.from("deletion_requests")
      .select("*").eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString());

    let count = 0;
    for (const req of pending || []) {
      try {
        await this._deleteUserData((req as any).user_id);
        await sb.from("deletion_requests")
          .update({ status: "completed" }).eq("id", (req as any).id);
        count++;
      } catch (e) {
        console.error(`Failed to delete user ${(req as any).user_id}:`, e);
      }
    }
    return count;
  }

  private async _deleteUserData(userId: string): Promise<void> {
    // Anonymize instead of hard delete (needed for financial records)
    const anon = `deleted_${Date.now()}`;
    await sb.from("profiles").update({
      phone:     null,
      full_name: "Deleted User",
      avatar_url:null,
      is_deleted: true,
      metadata:   {},
    }).eq("id", userId);

    // Delete sensitive data
    await sb.from("trusted_contacts").delete().eq("user_id", userId);
    await sb.from("refresh_tokens").delete().eq("user_id", userId);
    await sb.from("chat_messages").update({ content: "[deleted]" }).eq("sender_id", userId);
  }

  async getPrivacySettings(userId: string) {
    const { data } = await sb.from("privacy_settings")
      .select("*").eq("user_id", userId).single();
    return data || {
      user_id:           userId,
      analytics_enabled: true,
      marketing_enabled: true,
      share_location:    true,
      data_retention_days: 365,
    };
  }

  async updatePrivacySettings(userId: string, settings: object): Promise<void> {
    await sb.from("privacy_settings").upsert({
      user_id: userId, ...settings, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  }
}
