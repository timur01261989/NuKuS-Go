import React, { useEffect, useState } from 'react';
import { Card, CardContent, Button } from '../../shared/ui/index.js';
import { getMarketRemoteConfig } from '../../services/marketMetaService.js';
import { listMarketCars, formatPriceUZS, getMarketConfig } from '../../services/marketService.js';

function fmtKm(km){ const n=Number(km||0); try { return new Intl.NumberFormat('uz-UZ').format(n) + ' km'; } catch { return n+' km'; } }

export function AutoMarketPreview({ onOpenMarket }) {
  const [cfg, setCfg] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const c = await getMarketConfig();
        const rc = await getMarketRemoteConfig();
        const limit = rc?.market?.ui?.preview_count ?? (c?.ui?.show_preview_count ?? 6);
        const list = await listMarketCars({ limit });
        if (mounted) { setCfg(c); setItems(list); }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (cfg && cfg.enabled === false) return null;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold">{cfg?.title || 'Avto savdo'}</div>
        <Button size="sm" onClick={onOpenMarket}>{cfg?.cta_label || 'Savdoga kirish'}</Button>
      </div>
      <div className="text-sm text-gray-600 mt-1">Pastga suring — yangi e’lonlar ko‘rinadi</div>

      {loading && <div className="text-sm text-gray-600 mt-3">Yuklanmoqda...</div>}

      <div className="mt-3 space-y-2">
        {items.map((x) => (
          <Card key={x.id} className="hover:bg-gray-50">
            <CardContent className="p-3 flex gap-3">
              <img src={x.image} alt={x.title} className="h-14 w-20 rounded-lg object-cover border border-gray-100" />
              <div className="flex-1">
                <div className="font-semibold text-sm">{x.title}</div>
                <div className="text-xs text-gray-600">{x.city} • {x.year} • {fmtKm(x.mileage_km)}</div>
                <div className="mt-1 text-sm">{formatPriceUZS(x.price_uzs)}</div>
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && items.length === 0 && (
          <div className="text-sm text-gray-600">Hozircha e’lon yo‘q.</div>
        )}
      </div>
    </div>
  );
}
