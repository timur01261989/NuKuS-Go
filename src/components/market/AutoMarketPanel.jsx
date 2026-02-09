import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Card, CardHeader, CardContent, Button } from '../../shared/ui/index.js';
import { PostAdForm } from './PostAdForm.jsx';
import { getMarketTiles } from '../../services/marketMetaService.js';
import { listMarketCars, formatPriceUZS, getMarketConfig } from '../../services/marketService.js';

function fmtKm(km){ const n=Number(km||0); try { return new Intl.NumberFormat('uz-UZ').format(n) + ' km'; } catch { return n+' km'; } }

export function AutoMarketPanel({ open, onClose }) {
  const [cfg, setCfg] = useState(null);
  const [items, setItems] = useState([]);
  const [mode, setMode] = useState('browse');
  const [tiles, setTiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const c = await getMarketConfig();
      setCfg(c);
      const t = await getMarketTiles();
      setTiles(t?.tiles || []);
      const list = await listMarketCars();
      setItems(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (open) load(); }, [open]);

  const title = cfg?.title || 'Avto savdo';

  return (
    <Modal open={open} title={title} onClose={onClose}>
      {loading && <div className="text-sm text-gray-600">Yuklanmoqda...</div>}
      {!loading && !selected && (
        <>

        <div className="space-y-3">
          {mode === 'post' ? (
            <PostAdForm onDone={() => { setMode('browse'); load(); }} />
          ) : null}
          {mode === 'browse' ? (
          <div className="text-sm text-gray-600">Yangi qo‘shilgan moshinalar</div>

          <div className="flex flex-wrap gap-2">
            {(tiles || []).map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  if (t.action?.type === 'open_post_ad') { setMode('post'); setSelected(null); }
                  else { setMode('browse'); setSelected(null); }
                }}
                className="rounded-full border border-gray-200 px-3 py-2 text-sm hover:bg-gray-100"
              >
                {t.title?.uz || t.id}{t.badge ? <span className="ml-2 text-xs text-red-600">{t.badge}</span> : null}
              </button>
            ))}
          </div>

          <div className="max-h-[60vh] overflow-auto space-y-2">
            {items.map((x) => (
              <button key={x.id} className="w-full text-left" onClick={() => setSelected(x)}>
                <Card className="hover:bg-gray-50">
                  <CardContent className="p-3 flex gap-3">
                    <img src={x.image} alt={x.title} className="h-16 w-24 rounded-lg object-cover border border-gray-100" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{x.title}</div>
                      <div className="text-xs text-gray-600">{x.city} • {x.year} • {fmtKm(x.mileage_km)}</div>
                      <div className="mt-1 text-sm">{formatPriceUZS(x.price_uzs)}</div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
            {items.length === 0 && <div className="text-sm text-gray-600">Hozircha e’lon yo‘q.</div>}
          </div>
                    ) : null}

          {mode === 'browse' ? (
            <div className="flex justify-end">
            <Button variant="secondary" onClick={onClose}>Yopish</Button>
          </div>
            </div>
          ) : null}
        </div>
        </>
      )}

      {!loading && selected && (
        <div className="space-y-3">
          {mode === 'post' ? (
            <PostAdForm onDone={() => { setMode('browse'); load(); }} />
          ) : null}
          {mode === 'browse' ? (
          <Card>
            <CardContent className="p-3">
              <img src={selected.image} alt={selected.title} className="w-full h-48 rounded-xl object-cover border border-gray-100" />
              <div className="mt-3 font-semibold">{selected.title}</div>
              <div className="text-sm text-gray-700 mt-1">{formatPriceUZS(selected.price_uzs)}</div>
              <div className="text-sm text-gray-600 mt-1">{selected.city} • {selected.year} • {fmtKm(selected.mileage_km)}</div>
              <div className="text-sm text-gray-700 mt-2">{selected.desc}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded-full text-xs border border-gray-200">{selected.fuel}</span>
                <span className="px-2 py-1 rounded-full text-xs border border-gray-200">{selected.gearbox}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setSelected(null)}>Orqaga</Button>
            {selected.phone ? (
              <a className="inline-flex" href={`tel:${selected.phone}`}>
                <Button>Qo‘ng‘iroq</Button>
              </a>
            ) : (
              <Button disabled>Qo‘ng‘iroq</Button>
            )}
          </div>
            </div>
          ) : null}
        </div>
        </>
      )}
    </Modal>
  );
}
