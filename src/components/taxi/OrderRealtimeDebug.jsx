import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '../../shared/ui/index.js';
import { useOrderRealtime } from '../../hooks/useOrderRealtime.js';
import { useDriverLocationRealtime } from '../../hooks/useDriverLocationRealtime.js';

export function OrderRealtimeDebug() {
  const [orderId, setOrderId] = useState('');
  const { order } = useOrderRealtime(orderId);
  const { location } = useDriverLocationRealtime(orderId);

  const orderText = useMemo(() => JSON.stringify(order || null, null, 2), [order]);
  const locText = useMemo(() => JSON.stringify(location || null, null, 2), [location]);

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">Taxi Order Realtime (Supabase)</div>

      <Card>
        <CardContent className="p-3 space-y-3">
          <label className="text-xs text-gray-600">Order ID
            <input
              className="mt-1 w-full rounded-lg border p-2 text-sm"
              placeholder="UUID order id"
              value={orderId}
              onChange={(e)=>setOrderId(e.target.value.trim())}
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-600 mb-1">Order (last)</div>
              <pre className="h-64 overflow-auto rounded-lg border bg-white p-2 text-xs">{orderText}</pre>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Driver Location (last)</div>
              <pre className="h-64 overflow-auto rounded-lg border bg-white p-2 text-xs">{locText}</pre>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Env: VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY qo‘yilgan bo‘lishi shart.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
