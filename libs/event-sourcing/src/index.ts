import { createClient } from "@supabase/supabase-js";
import { v4 as uuid } from "uuid";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// ── Event Store ───────────────────────────────────────────────────────────────
export interface DomainEvent<T = any> {
  id:           string;
  stream_id:    string;   // aggregate ID (e.g. orderId)
  stream_type:  string;   // aggregate type (e.g. "Order")
  event_type:   string;   // e.g. "OrderCreated", "DriverAssigned"
  version:      number;   // optimistic concurrency
  payload:      T;
  metadata: {
    user_id?:    string;
    service:     string;
    timestamp:   string;
    correlation_id?: string;
  };
  occurred_at:  string;
}

export class EventStore {
  private static service = process.env.SERVICE_NAME || "unknown";

  static async append<T>(
    streamId:   string,
    streamType: string,
    eventType:  string,
    payload:    T,
    expectedVersion?: number
  ): Promise<DomainEvent<T>> {
    // Get current version
    const { count } = await sb.from("event_store")
      .select("id", { count: "exact", head: true })
      .eq("stream_id", streamId);

    const version = (count || 0) + 1;

    if (expectedVersion !== undefined && version - 1 !== expectedVersion) {
      throw new Error(`Concurrency conflict: expected v${expectedVersion}, got v${version - 1}`);
    }

    const event: DomainEvent<T> = {
      id:          uuid(),
      stream_id:   streamId,
      stream_type: streamType,
      event_type:  eventType,
      version,
      payload,
      metadata: {
        service:   this.service,
        timestamp: new Date().toISOString(),
      },
      occurred_at: new Date().toISOString(),
    };

    const { error } = await sb.from("event_store").insert(event);
    if (error) throw error;

    // Publish to Kafka for projections
    await fetch(
      `${process.env.ANALYTICS_SERVICE_URL || "http://analytics-service:3013"}/analytics/track/order`,
      { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: streamId, event_type: eventType, ...payload }) }
    ).catch(() => null);

    return event;
  }

  static async getStream(streamId: string): Promise<DomainEvent[]> {
    const { data, error } = await sb.from("event_store")
      .select("*")
      .eq("stream_id", streamId)
      .order("version", { ascending: true });
    if (error) throw error;
    return (data || []) as DomainEvent[];
  }

  static async getStreamFrom(streamId: string, fromVersion: number): Promise<DomainEvent[]> {
    const { data } = await sb.from("event_store")
      .select("*").eq("stream_id", streamId)
      .gte("version", fromVersion)
      .order("version", { ascending: true });
    return (data || []) as DomainEvent[];
  }

  static async replay(streamId: string, reducer: (state: any, event: DomainEvent) => any): Promise<any> {
    const events = await this.getStream(streamId);
    return events.reduce(reducer, null);
  }
}

// ── Predefined Order Events ───────────────────────────────────────────────────
export const OrderEvents = {
  CREATED:           "OrderCreated",
  DRIVER_SEARCHED:   "DriverSearchStarted",
  DRIVER_OFFERED:    "DriverOffered",
  DRIVER_ACCEPTED:   "DriverAccepted",
  DRIVER_ARRIVED:    "DriverArrived",
  RIDE_STARTED:      "RideStarted",
  RIDE_COMPLETED:    "RideCompleted",
  PAYMENT_INITIATED: "PaymentInitiated",
  PAYMENT_COMPLETED: "PaymentCompleted",
  CANCELLED:         "OrderCancelled",
  SOS_TRIGGERED:     "SOSTriggered",
};

// ── Order Aggregate Reducer ──────────────────────────────────────────────────
export function orderReducer(state: any, event: DomainEvent): any {
  if (!state) state = { status: "NONE", history: [] };
  const s = { ...state, history: [...(state.history || []), event.event_type] };

  switch (event.event_type) {
    case OrderEvents.CREATED:         return { ...s, ...event.payload, status: "CREATED",          version: event.version };
    case OrderEvents.DRIVER_OFFERED:  return { ...s, driver_id: event.payload.driver_id, status: "DRIVER_OFFERED",  version: event.version };
    case OrderEvents.DRIVER_ACCEPTED: return { ...s, status: "DRIVER_ACCEPTED", accepted_at: event.occurred_at, version: event.version };
    case OrderEvents.DRIVER_ARRIVED:  return { ...s, status: "DRIVER_ARRIVED",  arrived_at:  event.occurred_at, version: event.version };
    case OrderEvents.RIDE_STARTED:    return { ...s, status: "RIDE_STARTED",    started_at:  event.occurred_at, version: event.version };
    case OrderEvents.RIDE_COMPLETED:  return { ...s, status: "COMPLETED",       completed_at:event.occurred_at, version: event.version };
    case OrderEvents.PAYMENT_COMPLETED:return{ ...s, status: "PAID",            paid_at:     event.occurred_at, version: event.version };
    case OrderEvents.CANCELLED:       return { ...s, status: "CANCELLED",       reason: event.payload.reason,   version: event.version };
    default: return s;
  }
}
