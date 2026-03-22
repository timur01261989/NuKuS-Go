import { createClient } from "@supabase/supabase-js";
import { v4 as uuid } from "uuid";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export type ReportType = "daily_ops" | "weekly_revenue" | "driver_earnings" | "city_heatmap" | "safety_summary";
export type ReportStatus = "pending" | "generating" | "ready" | "failed";

export interface Report {
  id:           string;
  type:         ReportType;
  period_start: string;
  period_end:   string;
  status:       ReportStatus;
  data:         Record<string, any>;
  summary:      string;
  created_by?:  string;
  created_at:   string;
  ready_at?:    string;
}

export class ReportService {

  async generateDailyOps(date: string): Promise<Report> {
    const dayStart = `${date}T00:00:00Z`;
    const dayEnd   = `${date}T23:59:59Z`;

    const [orders, drivers, payments, incidents] = await Promise.all([
      sb.from("orders").select("status, service_type, price_uzs")
        .gte("created_at", dayStart).lte("created_at", dayEnd),
      sb.from("driver_presence").select("driver_id, is_online")
        .gte("updated_at", dayStart),
      sb.from("payments").select("amount_uzs, provider, status")
        .gte("created_at", dayStart).lte("created_at", dayEnd),
      sb.from("safety_alerts").select("type, status")
        .gte("created_at", dayStart).lte("created_at", dayEnd),
    ]);

    const allOrders  = orders.data || [];
    const completed  = allOrders.filter((o: any) => o.status === "completed");
    const cancelled  = allOrders.filter((o: any) => o.status === "cancelled");
    const revenue    = completed.reduce((s: number, o: any) => s + (o.price_uzs || 0), 0);

    const byService: Record<string, number> = {};
    for (const o of allOrders as any[]) {
      byService[o.service_type] = (byService[o.service_type] || 0) + 1;
    }

    const data = {
      date,
      orders: {
        total:         allOrders.length,
        completed:     completed.length,
        cancelled:     cancelled.length,
        completion_rate: allOrders.length ? Math.round(completed.length / allOrders.length * 100) : 0,
        by_service:    byService,
      },
      revenue: {
        total_uzs:    revenue,
        avg_uzs:      completed.length ? Math.round(revenue / completed.length) : 0,
        by_provider:  (payments.data || []).reduce((acc: any, p: any) => {
          acc[p.provider] = (acc[p.provider] || 0) + (p.amount_uzs || 0);
          return acc;
        }, {}),
      },
      drivers: {
        peak_online: (drivers.data || []).length,
        active_today:(drivers.data || []).length,
      },
      safety: {
        incidents:     (incidents.data || []).length,
        sos_count:     (incidents.data || []).filter((i: any) => i.type === "sos").length,
        resolved:      (incidents.data || []).filter((i: any) => i.status === "resolved").length,
      },
    };

    const summary = `${date}: ${data.orders.total} buyurtma, ` +
      `${data.orders.completed} bajarildi, ` +
      `${Math.round(revenue / 1000000 * 10) / 10}M so'm daromad. ` +
      `${data.safety.sos_count} SOS hodisa.`;

    return this._saveReport("daily_ops", dayStart, dayEnd, data, summary);
  }

  async generateWeeklyRevenue(): Promise<Report> {
    const now       = new Date();
    const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString();
    const weekEnd   = now.toISOString();

    const { data: orders } = await sb.from("orders")
      .select("price_uzs, service_type, created_at, status")
      .gte("created_at", weekStart).eq("status", "completed");

    const byDay: Record<string, number> = {};
    const byService: Record<string, number> = {};
    let total = 0;

    for (const o of (orders || []) as any[]) {
      const day = o.created_at.slice(0, 10);
      byDay[day] = (byDay[day] || 0) + (o.price_uzs || 0);
      byService[o.service_type] = (byService[o.service_type] || 0) + (o.price_uzs || 0);
      total += o.price_uzs || 0;
    }

    const data = {
      period: { start: weekStart, end: weekEnd },
      total_revenue_uzs: total,
      avg_daily_uzs:     Math.round(total / 7),
      by_day:            byDay,
      by_service:        byService,
      total_orders:      (orders || []).length,
    };

    const summary = `Haftalik: ${Math.round(total / 1000000)}M so'm daromad, ` +
      `${data.total_orders} buyurtma.`;

    return this._saveReport("weekly_revenue", weekStart, weekEnd, data, summary);
  }

  async getReports(type?: ReportType, limit = 20): Promise<Report[]> {
    let q = sb.from("reports").select("*").order("created_at", { ascending: false }).limit(limit);
    if (type) q = q.eq("type", type);
    const { data } = await q;
    return (data || []) as Report[];
  }

  async getReport(id: string): Promise<Report | null> {
    const { data } = await sb.from("reports").select("*").eq("id", id).single();
    return data as Report | null;
  }

  private async _saveReport(
    type: ReportType, start: string, end: string,
    data: object, summary: string, createdBy?: string
  ): Promise<Report> {
    const { data: report, error } = await sb.from("reports").insert({
      id: uuid(), type, period_start: start, period_end: end,
      status: "ready", data, summary, created_by: createdBy,
      created_at: new Date().toISOString(), ready_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return report as Report;
  }
}
