import { createClient } from "@supabase/supabase-js";
import IORedis from "ioredis";
import { v4 as uuid } from "uuid";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const redis = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  lazyConnect: true,
  maxRetriesPerRequest: 2,
});

export interface DomainEvent {
  id:            string;
  stream_id:     string;      // e.g. "order:abc123"
  stream_type:   string;      // e.g. "Order", "Driver", "Payment"
  event_type:    string;      // e.g. "OrderCreated", "DriverAssigned"
  version:       number;      // Optimistic concurrency
  payload:       Record<string, any>;
  metadata: {
    correlation_id?: string;
    causation_id?:   string;
    user_id?:        string;
    service:         string;
    timestamp:       string;
  };
  created_at:    string;
}

export type EventHandler = (event: DomainEvent) => Promise<void>;
const handlers = new Map<string, EventHandler[]>();

/** Append event to stream (append-only, immutable) */
export async function appendEvent(
  streamId:   string,
  streamType: string,
  eventType:  string,
  payload:    Record<string, any>,
  metadata:   Partial<DomainEvent["metadata"]> = {}
): Promise<DomainEvent> {
  // Get current version
  const { count } = await sb.from("event_store")
    .select("id", { count: "exact" }).eq("stream_id", streamId);
  const version = (count || 0) + 1;

  const event: DomainEvent = {
    id:          uuid(),
    stream_id:   streamId,
    stream_type: streamType,
    event_type:  eventType,
    version,
    payload,
    metadata: {
      ...metadata,
      service:   process.env.SERVICE_NAME || "unknown",
      timestamp: new Date().toISOString(),
    },
    created_at: new Date().toISOString(),
  };

  const { error } = await sb.from("event_store").insert(event);
  if (error) throw error;

  // Publish to Redis for real-time projection
  await redis.publish(`events:${streamType}`, JSON.stringify(event)).catch(() => null);

  // Run registered handlers
  const typeHandlers = handlers.get(eventType) || [];
  for (const h of typeHandlers) {
    h(event).catch(err => console.error(`[EventStore] Handler error for ${eventType}:`, err));
  }

  return event;
}

/** Get all events for a stream (full history) */
export async function getStream(streamId: string): Promise<DomainEvent[]> {
  const { data } = await sb.from("event_store")
    .select("*")
    .eq("stream_id", streamId)
    .order("version", { ascending: true });
  return (data || []) as DomainEvent[];
}

/** Get events since a version (for catch-up) */
export async function getStreamSince(streamId: string, fromVersion: number): Promise<DomainEvent[]> {
  const { data } = await sb.from("event_store")
    .select("*")
    .eq("stream_id", streamId)
    .gt("version", fromVersion)
    .order("version", { ascending: true });
  return (data || []) as DomainEvent[];
}

/** Rebuild aggregate state from events (Event Sourcing core) */
export async function rebuildState<T>(
  streamId:    string,
  initialState: T,
  reducer:     (state: T, event: DomainEvent) => T
): Promise<T> {
  const events = await getStream(streamId);
  return events.reduce(reducer, initialState);
}

/** Register event handler (for projections/sagas) */
export function on(eventType: string, handler: EventHandler): void {
  if (!handlers.has(eventType)) handlers.set(eventType, []);
  handlers.get(eventType)!.push(handler);
}

/** Subscribe to event stream via Redis */
export async function subscribe(streamType: string, handler: (event: DomainEvent) => void): Promise<void> {
  const sub = new IORedis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    lazyConnect: true,
  });
  await sub.subscribe(`events:${streamType}`);
  sub.on("message", (_, msg) => {
    try { handler(JSON.parse(msg)); } catch {}
  });
}

// ── Pre-defined Order Events ────────────────────────────────────────

export const OrderEvents = {
  created:        (orderId: string, data: any) => appendEvent(`order:${orderId}`, "Order", "OrderCreated",       data),
  searching:      (orderId: string, data: any) => appendEvent(`order:${orderId}`, "Order", "DriverSearchStarted", data),
  driverAssigned: (orderId: string, data: any) => appendEvent(`order:${orderId}`, "Order", "DriverAssigned",     data),
  driverArrived:  (orderId: string, data: any) => appendEvent(`order:${orderId}`, "Order", "DriverArrived",      data),
  rideStarted:    (orderId: string, data: any) => appendEvent(`order:${orderId}`, "Order", "RideStarted",        data),
  rideCompleted:  (orderId: string, data: any) => appendEvent(`order:${orderId}`, "Order", "RideCompleted",      data),
  cancelled:      (orderId: string, data: any) => appendEvent(`order:${orderId}`, "Order", "OrderCancelled",     data),
  paymentDone:    (orderId: string, data: any) => appendEvent(`order:${orderId}`, "Order", "PaymentCompleted",   data),
};

export const DriverEvents = {
  wentOnline:     (driverId: string, data: any) => appendEvent(`driver:${driverId}`, "Driver", "DriverWentOnline",  data),
  wentOffline:    (driverId: string, data: any) => appendEvent(`driver:${driverId}`, "Driver", "DriverWentOffline", data),
  locationUpdated:(driverId: string, data: any) => appendEvent(`driver:${driverId}`, "Driver", "LocationUpdated",   data),
  ratingUpdated:  (driverId: string, data: any) => appendEvent(`driver:${driverId}`, "Driver", "RatingUpdated",     data),
};

export const PaymentEvents = {
  initiated:      (payId: string, data: any) => appendEvent(`payment:${payId}`, "Payment", "PaymentInitiated",  data),
  confirmed:      (payId: string, data: any) => appendEvent(`payment:${payId}`, "Payment", "PaymentConfirmed",  data),
  failed:         (payId: string, data: any) => appendEvent(`payment:${payId}`, "Payment", "PaymentFailed",     data),
  refunded:       (payId: string, data: any) => appendEvent(`payment:${payId}`, "Payment", "PaymentRefunded",   data),
};
