import { useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { getQueuePosition, joinQueue } from '../services/districtApi';

// Standart rejim: navbat logikasi
export function usePitakLogic({ driverId, enabled }) {
  const [queue, setQueue] = useState({ position: null, total: 0 });
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!enabled) return;
    if (!driverId) return;
    setLoading(true);
    try {
      const q = await getQueuePosition({ driver_id: driverId });
      setQueue(q);
    } catch (e) {
      // Supabase yo'q bo'lsa ham UI yiqilmasin
      console.warn('Queue position error:', e);
    } finally {
      setLoading(false);
    }
  };

  const join = async () => {
    if (!enabled) return;
    if (!driverId) return message.warning('driverId yo‘q');
    setLoading(true);
    try {
      await joinQueue({ driver_id: driverId });
      message.success('Navbatga qo‘shildingiz');
      await refresh();
    } catch (e) {
      console.warn('Join queue error:', e);
      message.warning('Navbatga qo‘shib bo‘lmadi (Supabase sozlanmagan bo‘lishi mumkin)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const t = setInterval(refresh, 7000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, driverId]);

  return useMemo(() => ({ queue, loading, refresh, join }), [queue, loading]);
}
