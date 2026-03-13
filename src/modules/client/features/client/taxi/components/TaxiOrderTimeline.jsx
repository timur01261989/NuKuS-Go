import React, { memo, useMemo } from 'react';

function eventLabel(event) {
  const code = String(event?.event_code || '').toLowerCase();
  if (code === 'order.created') return 'Buyurtma yaratildi';
  if (code === 'order.offers_created' || code === 'order.offer_sent') return 'Haydovchilarga taklif yuborildi';
  if (code === 'order.driver_assigned' || code === 'order.accepted') return 'Haydovchi biriktirildi';
  if (code === 'order.arrived') return 'Haydovchi yetib keldi';
  if (code === 'order.in_progress') return 'Safar boshlandi';
  if (code === 'order.completed') return 'Safar yakunlandi';
  if (code === 'order.offer_rejected') return 'Taklif rad etildi';
  if (code === 'order.offer_expired') return 'Taklif muddati tugadi';
  if (code === 'order.dispatch_retry_queued') return 'Qayta qidirish navbatga qoʻyildi';
  return event?.event_code || 'Hodisa';
}

function formatTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

function TaxiOrderTimeline({ events = [], title = 'Buyurtma holati' }) {
  const safeEvents = useMemo(() => (Array.isArray(events) ? events : []), [events]);
  if (!safeEvents.length) return null;

  return (
    <div style={{ marginTop: 12, background: '#fff', borderRadius: 18, padding: 12, boxShadow: '0 10px 22px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {safeEvents.map((event) => (
          <div key={event.id} style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 10, alignItems: 'start' }}>
            <div style={{ fontSize: 12, opacity: 0.65 }}>{formatTime(event.created_at)}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{eventLabel(event)}</div>
              {event?.reason ? <div style={{ fontSize: 12, opacity: 0.7 }}>{event.reason}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(TaxiOrderTimeline);
