import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

const TIMELINE_ENABLED = String(import.meta?.env?.VITE_ENABLE_ORDER_TIMELINE || '').trim() === '1';

function normalizeEvent(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    id: row.id,
    order_id: row.order_id,
    event_code: row.event_code || row.event || '',
    actor_role: row.actor_role || null,
    actor_user_id: row.actor_user_id || row.actor_id || null,
    from_status: row.from_status || null,
    to_status: row.to_status || null,
    reason: row.reason || null,
    payload: row.payload && typeof row.payload === 'object' ? row.payload : {},
    created_at: row.created_at || null,
  };
}

function isValidOrderId(orderId) {
  return typeof orderId === 'string' && orderId.trim().length >= 8;
}

export function useOrderTimeline(orderId, limit = 30) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    let channel = null;

    const enabled = TIMELINE_ENABLED && isValidOrderId(orderId) && !!supabase;
    if (!enabled) {
      setEvents([]);
      setLoading(false);
      return () => {};
    }

    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('order_events')
          .select('id,order_id,event_code,actor_role,actor_user_id,reason,from_status,to_status,payload,created_at')
          .eq('order_id', String(orderId))
          .order('created_at', { ascending: true })
          .limit(Math.max(1, Math.min(100, Number(limit) || 30)));
        if (!alive) return;
        if (error) {
          setEvents([]);
          return;
        }
        setEvents(Array.isArray(data) ? data.map(normalizeEvent).filter(Boolean) : []);
      } catch {
        if (!alive) return;
        setEvents([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    if (supabase?.channel) {
      channel = supabase
        .channel(`order-events:${orderId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'order_events', filter: `order_id=eq.${orderId}` },
          (payload) => {
            const next = normalizeEvent(payload?.new);
            if (!next) return;
            setEvents((prev) => {
              if (prev.some((item) => String(item.id) === String(next.id))) return prev;
              return [...prev, next];
            });
          }
        )
        .subscribe();
    }

    return () => {
      alive = false;
      if (channel && supabase?.removeChannel) supabase.removeChannel(channel);
    };
  }, [orderId, limit]);

  const latest = useMemo(() => (events.length ? events[events.length - 1] : null), [events]);

  return { events, latest, loading };
}

export default useOrderTimeline;
