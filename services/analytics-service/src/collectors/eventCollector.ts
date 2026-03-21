import { clickhouse } from "../clickhouse.client";

export interface OrderEvent {
  order_id: string;
  user_id:  string;
  driver_id?: string;
  service:   string;
  event_type: string;
  status:    string;
  price_uzs: number;
  lat?: number;
  lng?: number;
  city?: string;
}

export interface DriverLocationEvent {
  driver_id: string;
  lat: number;
  lng: number;
  bearing: number;
  speed: number;
}

export interface PaymentEvent {
  order_id:  string;
  user_id:   string;
  provider:  string;
  amount_uzs: number;
  status:    string;
}

/** Batch buffer for high-throughput inserts */
const orderBuffer: OrderEvent[]         = [];
const locationBuffer: DriverLocationEvent[] = [];
const paymentBuffer: PaymentEvent[]     = [];
const BATCH_SIZE = 500;
const FLUSH_MS   = 2000;

async function flushOrders() {
  if (!orderBuffer.length) return;
  const rows = [...orderBuffer];
  orderBuffer.length = 0;
  await clickhouse.insert({ table: "order_events", values: rows, format: "JSONEachRow" });
}

async function flushLocations() {
  if (!locationBuffer.length) return;
  const rows = [...locationBuffer];
  locationBuffer.length = 0;
  await clickhouse.insert({ table: "driver_location_events", values: rows, format: "JSONEachRow" });
}

async function flushPayments() {
  if (!paymentBuffer.length) return;
  const rows = [...paymentBuffer];
  paymentBuffer.length = 0;
  await clickhouse.insert({ table: "payment_events", values: rows, format: "JSONEachRow" });
}

// Periodic flush
setInterval(() => { flushOrders().catch(console.error); }, FLUSH_MS);
setInterval(() => { flushLocations().catch(console.error); }, FLUSH_MS);
setInterval(() => { flushPayments().catch(console.error); }, FLUSH_MS);

export const eventCollector = {
  trackOrder:    (e: OrderEvent)         => { orderBuffer.push(e);    if (orderBuffer.length >= BATCH_SIZE) flushOrders(); },
  trackLocation: (e: DriverLocationEvent) => { locationBuffer.push(e); if (locationBuffer.length >= BATCH_SIZE) flushLocations(); },
  trackPayment:  (e: PaymentEvent)       => { paymentBuffer.push(e);  if (paymentBuffer.length >= BATCH_SIZE) flushPayments(); },
};
