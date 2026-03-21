import { clickhouse } from "../clickhouse.client";

export interface DashboardMetrics {
  total_orders_today:   number;
  completed_today:      number;
  cancelled_today:      number;
  revenue_today_uzs:    number;
  active_drivers_now:   number;
  avg_trip_price_uzs:   number;
  orders_by_service:    Record<string, number>;
  hourly_orders:        { hour: number; count: number }[];
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const today = new Date().toISOString().slice(0, 10);

  const [summary, byService, hourly] = await Promise.all([
    clickhouse.query({
      query: `
        SELECT
          count()                                                    AS total,
          countIf(status = 'completed')                              AS completed,
          countIf(status = 'cancelled')                              AS cancelled,
          sumIf(price_uzs, status = 'completed')                     AS revenue,
          avgIf(price_uzs, status = 'completed')                     AS avg_price
        FROM order_events
        WHERE toDate(ts) = '${today}'`,
      format: "JSONEachRow",
    }).then(r => r.json<any[]>()),

    clickhouse.query({
      query: `
        SELECT service, count() AS cnt
        FROM order_events
        WHERE toDate(ts) = '${today}'
        GROUP BY service`,
      format: "JSONEachRow",
    }).then(r => r.json<any[]>()),

    clickhouse.query({
      query: `
        SELECT toHour(ts) AS hour, count() AS count
        FROM order_events
        WHERE toDate(ts) = '${today}'
        GROUP BY hour
        ORDER BY hour`,
      format: "JSONEachRow",
    }).then(r => r.json<any[]>()),
  ]);

  const s = summary[0] || {};
  const serviceMap: Record<string, number> = {};
  (byService || []).forEach((r: any) => { serviceMap[r.service] = Number(r.cnt); });

  return {
    total_orders_today:  Number(s.total   || 0),
    completed_today:     Number(s.completed || 0),
    cancelled_today:     Number(s.cancelled || 0),
    revenue_today_uzs:   Number(s.revenue  || 0),
    active_drivers_now:  0, // populated from Redis
    avg_trip_price_uzs:  Number(s.avg_price || 0),
    orders_by_service:   serviceMap,
    hourly_orders:       (hourly || []).map((r: any) => ({ hour: Number(r.hour), count: Number(r.count) })),
  };
}
