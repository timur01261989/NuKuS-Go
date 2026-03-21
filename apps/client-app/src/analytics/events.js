// src/analytics/events.js
// Lightweight event logger: sends to your server or Supabase.
// Keep schema stable. Do NOT log PII you don't need.
export const Events = Object.freeze({
  HOME_OPENED: 'home_opened',
  ORDER_CREATED: 'order_created',
  OFFER_SENT: 'offer_sent',
  OFFER_ACCEPTED: 'offer_accepted',
  TRIP_STARTED: 'trip_started',
  TRIP_COMPLETED: 'trip_completed',
  TRIP_CANCELLED: 'trip_cancelled',
});

export async function logEvent(baseUrl, event, props) {
  try {
    await fetch(`${baseUrl}/api/analytics`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event, props }),
    });
  } catch {}
}