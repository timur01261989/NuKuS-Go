import { useEffect } from 'react';
import api from '@/utils/apiHelper';
import { extractOrder } from '@/utils/apiResponse';
import { fromOrderResponse } from '../lib/taxiOrderAdapter';
import { getActiveOrderId, setActiveOrderId } from '../lib/taxiStorage';

export function useTaxiOrderPolling({ orderId, setOrderId, setOrderStatus, setPickup, setDest, setStep, cp, speak, setCompletedOrderForRating, setRatingVisible, setEarnedBonus, setAssignedDriver, assignedDriver, pickup, setEtaMin }) {
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const saved = getActiveOrderId();
        if (saved) setOrderId(saved);
        const res = await api.post('/api/order', { action: 'active' });
        const normalized = fromOrderResponse(extractOrder(res) || res);
        if (!mounted || !normalized?.id) return;
        setOrderId(normalized.id);
        setActiveOrderId(normalized.id);
        setOrderStatus(normalized.status || 'searching');
        if (normalized.pickup) {
          setPickup((prev) => ({
            ...prev,
            latlng: normalized.pickup.lat != null && normalized.pickup.lng != null ? [Number(normalized.pickup.lat), Number(normalized.pickup.lng)] : prev.latlng,
            address: normalized.pickup.address || prev.address,
          }));
        }
        if (normalized.dropoff) {
          setDest({
            latlng: normalized.dropoff.lat != null && normalized.dropoff.lng != null ? [Number(normalized.dropoff.lat), Number(normalized.dropoff.lng)] : null,
            address: normalized.dropoff.address || '',
          });
        }
        if (normalized.status === 'accepted' || normalized.status === 'coming' || normalized.status === 'arrived') setStep('coming');
        else if (normalized.status === 'searching' || normalized.status === 'offered') setStep('searching');
      } catch {
        // ignore initial active fetch failures
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [setDest, setOrderId, setOrderStatus, setPickup, setStep]);

  useEffect(() => {
    if (!orderId) return undefined;
    let alive = true;
    let timer = null;

    const tick = async () => {
      try {
        const res = await api.post('/api/order', { action: 'get', order_id: orderId });
        if (!alive) return;
        const normalized = fromOrderResponse(extractOrder(res) || res);
        if (!normalized) return;
        const st = normalized.status;
        setOrderStatus(st);
        if (st === 'accepted') speak(cp('Haydovchi topildi'));
        if (st === 'arrived') speak(cp('Haydovchi yetib keldi'));
        if (st === 'completed' || st === 'done') {
          speak(cp('Safar yakunlandi. Rahmat!'));
          const drvId = normalized.driver?.id || normalized.raw?.driver_id || normalized.raw?.assigned_driver_id || null;
          const clientId = normalized.raw?.client_id || normalized.raw?.user_id || null;
          setCompletedOrderForRating({ id: orderId, driver_id: drvId, client_id: clientId });
          setRatingVisible(true);
          const price = Number(normalized.raw?.price || normalized.raw?.amount || normalized.raw?.priceUzs || normalized.raw?.price_uzs || 0);
          setEarnedBonus(Math.max(1, Math.floor(price * 0.01)));
        }
        if (normalized.driver) {
          const drv = normalized.driver;
          setAssignedDriver({
            first_name: drv.first_name || drv.full_name || drv.name || 'Haydovchi',
            avatar_url: drv.avatar_url || drv.avatar || '',
            car_model: drv.car_model || drv.car || '',
            plate: drv.plate || drv.car_plate || '',
            lat: Number(drv.lat ?? drv.driver_lat ?? drv.latitude),
            lng: Number(drv.lng ?? drv.driver_lng ?? drv.longitude),
            bearing: Number(drv.bearing ?? drv.heading ?? 0),
            rating: Number(drv.rating ?? 4.8),
            phone: drv.phone || '',
          });
        }
        if (assignedDriver?.lat && assignedDriver?.lng && pickup?.latlng) {
          const haversineKm = (await import('../../shared/geo/haversine')).haversineKm;
          const d = haversineKm([assignedDriver.lat, assignedDriver.lng], pickup.latlng);
          setEtaMin(Math.max(1, Math.round(d * 3)));
        }
      } catch {
        // ignore polling errors
      }
    };

    const nextInterval = () => 4000;
    const loop = async () => {
      await tick();
      if (!alive) return;
      timer = setTimeout(loop, nextInterval());
    };
    loop();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [orderId, setOrderStatus, cp, speak, setCompletedOrderForRating, setRatingVisible, setEarnedBonus, setAssignedDriver, assignedDriver, pickup?.latlng, setEtaMin]);
}
