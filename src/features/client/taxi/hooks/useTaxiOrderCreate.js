import { useCallback } from 'react';
import { message } from 'antd';
import api from '@/utils/apiHelper';
import { extractApiError, extractOrderId } from '@/utils/apiResponse';
import { toCreateOrderPayload } from '../lib/taxiOrderAdapter';

export function useTaxiOrderCreate({ cp, MAX_KM, haversineKm, pickup, dest, tariff, totalPrice, distanceKm, waypoints, orderFor, otherPhone, wishes, comment, scheduledTime, onCreated, onError }) {
  return useCallback(async () => {
    if (!pickup?.latlng) {
      message.error(cp("Yo'lovchini olish nuqtasi aniqlanmadi"));
      return null;
    }
    if (dest?.latlng) {
      const d = distanceKm || haversineKm(pickup.latlng, dest.latlng);
      if (d > MAX_KM) {
        message.error(`Masofa belgilangan me'yoridan ortiq (${MAX_KM} km)`);
        return null;
      }
    }
    const hide = message.loading(cp('Buyurtma yuborilmoqda...'), 0);
    try {
      const payload = toCreateOrderPayload({ pickup, dest, tariff, totalPrice, distanceKm, waypoints, orderFor, otherPhone, wishes, comment, scheduledTime });
      const actions = ['create', 'create_taxi', 'create_city', 'new'];
      let res = null;
      let lastError = null;
      for (const action of actions) {
        try {
          res = await api.post('/api/order', { action, ...payload });
          const id = extractOrderId(res);
          if (id) {
            onCreated?.(id, res);
            return { id, response: res };
          }
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError || new Error(cp('Serverdan ID kelmadi'));
    } catch (error) {
      const errorText = extractApiError(error) || cp("Server bilan aloqa yo'q");
      message.error('Zakaz berishda xatolik: ' + errorText);
      onError?.(error);
      return null;
    } finally {
      hide();
    }
  }, [cp, MAX_KM, haversineKm, pickup, dest, tariff, totalPrice, distanceKm, waypoints, orderFor, otherPhone, wishes, comment, scheduledTime, onCreated, onError]);
}
