import { useEffect, useState } from 'react';
import { message } from 'antd';
import { supabase } from '@/services/supabase/supabaseClient';
import { listPremiumRequests } from '../services/districtApi';

// Premium rejim: seat requestlar real kelishi
export function usePremiumSocket({ enabled, onClientRequest, onRequest }) {
  const requestHandler = onClientRequest || onRequest;
  const [socketMeta, setSocketMeta] = useState({ state: enabled ? 'connecting' : 'idle', lastEventAt: null });

  useEffect(() => {
    if (!enabled) {
      setSocketMeta({ state: 'idle', lastEventAt: null });
      return;
    }

    let isMounted = true;
    setSocketMeta((prev) => ({ ...prev, state: 'connecting' }));

    async function bootstrap() {
      try {
        const data = await listPremiumRequests();
        if (!isMounted) return;
        (data || []).forEach((r) => requestHandler?.(normalizeRequest(r)));
        setSocketMeta({ state: 'ready', lastEventAt: new Date().toISOString() });
      } catch (e) {
        console.warn('Premium requests list error:', e);
        if (isMounted) {
          setSocketMeta((prev) => ({ ...prev, state: 'degraded' }));
        }
      }
    }

    bootstrap();

    if (!supabase) return;

    const channel = supabase
      .channel('district_requests_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'district_requests' },
        (payload) => {
          const r = payload?.new;
          const req = normalizeRequest(r);
          requestHandler?.(req);
          setSocketMeta({ state: 'ready', lastEventAt: new Date().toISOString() });
          message.info(`Yangi buyurtma: ${req.address || 'mijoz'}`);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'district_requests' },
        (payload) => {
          const r = payload?.new;
          const req = normalizeRequest(r);
          requestHandler?.(req);
          setSocketMeta({ state: 'ready', lastEventAt: new Date().toISOString() });
        }
      )
      .subscribe((status) => {
        if (!isMounted) return;
        setSocketMeta((prev) => ({
          ...prev,
          state: status === 'SUBSCRIBED' ? 'ready' : status === 'CHANNEL_ERROR' ? 'degraded' : prev.state,
        }));
      });

    return () => {
      isMounted = false;
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [enabled, requestHandler]);

  return socketMeta;
}

function normalizeRequest(r) {
  return {
    id: r?.id,
    name: r?.client_name || 'Mijoz',
    phone: r?.client_phone || '',
    lat: r?.pickup_lat,
    lng: r?.pickup_lng,
    address: r?.pickup_address || '',
    requestedSeats: r?.requested_seats || 1,
    created_at: r?.created_at,
    status: r?.status,
  };
}
