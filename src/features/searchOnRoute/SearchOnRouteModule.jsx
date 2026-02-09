import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardContent, Button, Modal } from '../../shared/ui/index.js';
import { getCategories, searchPoi } from '../../services/poiService.js';

export function SearchOnRouteModule() {
  const [cats, setCats] = useState([]);
  const [cat, setCat] = useState(null);
  const [pos, setPos] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openHelp, setOpenHelp] = useState(false);

  useEffect(() => {
    getCategories().then((c) => {
      setCats(c);
      setCat(c?.[0]?.id || null);
    });
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setPos({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const current = useMemo(() => cats.find(c => c.id === cat), [cats, cat]);

  async function runSearch() {
    if (!pos) { setOpenHelp(true); return; }
    setLoading(true);
    try {
      const res = await searchPoi({ lat: pos.lat, lon: pos.lon, radius_m: 3000, categoryId: cat });
      setItems(res);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-3">
      <Card>
        <CardHeader>
          <div className="text-base font-semibold">Yo‘lda qidirish</div>
          <div className="text-sm text-gray-600">GPS atrofidan servislarni topish (OSM level config)</div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {cats.map(c => (
              <button key={c.id}
                onClick={() => setCat(c.id)}
                className={['rounded-full px-3 py-2 text-sm border',
                  c.id === cat ? 'bg-black text-white border-black' : 'bg-white text-gray-800 border-gray-200'
                ].join(' ')}
              >{c.name_uz || c.name}</button>
            ))}
          </div>

          <div className="mt-3 text-sm text-gray-700">
            Tanlangan: <b>{current?.name_uz || current?.name}</b>
            <button className="ml-2 underline" onClick={() => setOpenHelp(true)}>?</button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Button onClick={runSearch} disabled={loading}>
              {loading ? 'Qidirilmoqda...' : 'Qidirish'}
            </Button>
            <div className="text-xs text-gray-500">
              {pos ? `GPS: ${pos.lat.toFixed(5)}, ${pos.lon.toFixed(5)}` : 'GPS yoqilmagan'}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {items.map(it => (
              <div key={it.id} className="rounded-xl border border-gray-200 p-3">
                <div className="font-semibold text-sm">{it.name}</div>
                <div className="text-xs text-gray-600">{it.distance_m ? `${Math.round(it.distance_m)} m` : ''}</div>
                <div className="text-xs text-gray-500">{it.lat.toFixed(5)}, {it.lon.toFixed(5)}</div>
              </div>
            ))}
            {!items.length && !loading && (
              <div className="text-sm text-gray-500">Natija yo‘q. (Test uchun local POI ishlaydi)</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Modal open={openHelp} title="Qanday ishlaydi?" onClose={() => setOpenHelp(false)}>
        <div className="text-sm text-gray-700 space-y-2">
          <div>1) GPS yoqilgan bo‘lsa, ilova atrofingizdan POI qidiradi.</div>
          <div>2) Test rejimida <b>local sample POI</b> ishlaydi.</div>
          <div>3) Keyin xohlasangiz, <b>public/config/poi.json</b> da provider=overpass qilib online qidiruvni yoqasiz.</div>
        </div>
      </Modal>
    </div>
  );
}
