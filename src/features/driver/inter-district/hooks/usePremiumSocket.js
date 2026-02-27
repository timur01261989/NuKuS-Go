import { useEffect } from 'react';
import { message } from 'antd';
import { supabase } from '../services/supabaseClient';
import { listPremiumRequests } from '../services/districtApi';

// Premium rejim: seat requestlar real kelishi
export function usePremiumSocket({ enabled, onRequest }) {
  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;

    async function bootstrap() {
      try {
        const { data } = await listPremiumRequests();
        if (!isMounted) return;
        (data || []).forEach((r) => onRequest?.(normalizeRequest(r)));
      } catch (e) {
        console.warn('Premium requests list error:', e);
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
          onRequest?.(req);
          message.info(`Yangi buyurtma: ${req.address || 'mijoz'}`);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'district_requests' },
        (payload) => {
          const r = payload?.new;
          const req = normalizeRequest(r);
          onRequest?.(req);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [enabled, onRequest]);
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
