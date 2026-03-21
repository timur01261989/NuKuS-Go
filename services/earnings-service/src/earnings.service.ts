import { createClient } from "@supabase/supabase-js";
import { v4 as uuid } from "uuid";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export interface EarningRecord {
  id:            string;
  driver_id:     string;
  order_id:      string;
  gross_uzs:     number;
  commission_pct: number;
  commission_uzs: number;
  net_uzs:       number;
  bonus_uzs:     number;
  tips_uzs:      number;
  date:          string;
  hour:          number;
  service_type:  string;
}

export interface EarningsSummary {
  driver_id:       string;
  today_gross:     number;
  today_net:       number;
  today_trips:     number;
  week_gross:      number;
  week_net:        number;
  week_trips:      number;
  month_gross:     number;
  month_net:       number;
  month_trips:     number;
  rating:          number;
  acceptance_rate: number;
  online_hours:    number;
  peak_hour:       number;
  best_day:        string;
}

const COMMISSION = {
  taxi:         0.20,  // 20%
  delivery:     0.18,
  freight:      0.15,
  intercity:    0.12,
  interdistrict:0.15,
  food:         0.22,
};

export class EarningsService {

  async recordEarning(
    driverId:    string,
    orderId:     string,
    grossAmount: number,
    serviceType: string,
    tipsUzs = 0
  ): Promise<EarningRecord> {
    const commission_pct = (COMMISSION as any)[serviceType] || 0.20;
    const commission_uzs = Math.round(grossAmount * commission_pct);
    const net_uzs        = grossAmount - commission_uzs + tipsUzs;
    const now            = new Date();

    const { data, error } = await sb.from("driver_earnings").insert({
      id: uuid(), driver_id: driverId, order_id: orderId,
      gross_uzs: grossAmount, commission_pct, commission_uzs,
      net_uzs, bonus_uzs: 0, tips_uzs: tipsUzs,
      date: now.toISOString().slice(0, 10),
      hour: now.getHours(), service_type: serviceType,
      created_at: now.toISOString(),
    }).select().single();
    if (error) throw error;

    // Credit driver wallet
    await fetch(`${process.env.WALLET_SERVICE_URL || "http://wallet-service:3024"}/wallet/credit`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        user_id: driverId, amount: net_uzs, type: "ride_payment",
        description: `Buyurtma #${orderId.slice(-6)} daromadi`,
        order_id: orderId,
      }),
    }).catch(() => null);

    return data as EarningRecord;
  }

  async addBonus(driverId: string, bonusUzs: number, reason: string): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    await sb.from("driver_earnings").insert({
      id: uuid(), driver_id: driverId, order_id: null,
      gross_uzs: 0, commission_pct: 0, commission_uzs: 0,
      net_uzs: bonusUzs, bonus_uzs: bonusUzs, tips_uzs: 0,
      date: today, hour: new Date().getHours(),
      service_type: "bonus", description: reason,
      created_at: new Date().toISOString(),
    });
    await fetch(`${process.env.WALLET_SERVICE_URL || "http://wallet-service:3024"}/wallet/credit`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: driverId, amount: bonusUzs, type: "bonus", description: reason }),
    }).catch(() => null);
  }

  async getSummary(driverId: string): Promise<EarningsSummary> {
    const now   = new Date();
    const today = now.toISOString().slice(0, 10);
    const weekAgo  = new Date(now.getTime() - 7  * 86400000).toISOString().slice(0, 10);
    const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);

    const [todayData, weekData, monthData, ratingData] = await Promise.all([
      sb.from("driver_earnings").select("net_uzs, gross_uzs").eq("driver_id", driverId).eq("date", today),
      sb.from("driver_earnings").select("net_uzs, gross_uzs").eq("driver_id", driverId).gte("date", weekAgo),
      sb.from("driver_earnings").select("net_uzs, gross_uzs").eq("driver_id", driverId).gte("date", monthAgo),
      sb.from("drivers").select("rating").eq("user_id", driverId).single(),
    ]);

    const sum = (rows: any[], field: string) => (rows || []).reduce((s: number, r: any) => s + (r[field] || 0), 0);

    // Peak hour analysis
    const { data: hourData } = await sb.from("driver_earnings")
      .select("hour").eq("driver_id", driverId).gte("date", weekAgo);
    const hourCounts: Record<number, number> = {};
    (hourData || []).forEach((r: any) => { hourCounts[r.hour] = (hourCounts[r.hour] || 0) + 1; });
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 17;

    return {
      driver_id:       driverId,
      today_gross:     sum(todayData.data || [], "gross_uzs"),
      today_net:       sum(todayData.data || [], "net_uzs"),
      today_trips:     (todayData.data || []).length,
      week_gross:      sum(weekData.data || [], "gross_uzs"),
      week_net:        sum(weekData.data || [], "net_uzs"),
      week_trips:      (weekData.data || []).length,
      month_gross:     sum(monthData.data || [], "gross_uzs"),
      month_net:       sum(monthData.data || [], "net_uzs"),
      month_trips:     (monthData.data || []).length,
      rating:          Number((ratingData.data as any)?.rating || 5.0),
      acceptance_rate: 0.87,
      online_hours:    0,
      peak_hour:       Number(peakHour),
      best_day:        "Juma",
    };
  }

  async getDailyBreakdown(driverId: string, days = 30): Promise<any[]> {
    const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const { data } = await sb.from("driver_earnings")
      .select("date, net_uzs, gross_uzs, service_type")
      .eq("driver_id", driverId).gte("date", since)
      .order("date");
    
    // Group by date
    const grouped: Record<string, any> = {};
    for (const row of (data || []) as any[]) {
      if (!grouped[row.date]) grouped[row.date] = { date: row.date, net: 0, gross: 0, trips: 0 };
      grouped[row.date].net   += row.net_uzs || 0;
      grouped[row.date].gross += row.gross_uzs || 0;
      grouped[row.date].trips += 1;
    }
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }
}
