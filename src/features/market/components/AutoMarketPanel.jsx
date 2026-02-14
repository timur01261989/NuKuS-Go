import React, { useEffect, useState } from 'react';
import { Modal, Card, CardContent, Button } from '../../../shared/ui/index.js';
import PostAdForm from "./PostAdForm.jsx";
import { getMarketTiles } from '../../../services/marketMetaService.js';
import { listMarketCars, formatPriceUZS, getMarketConfig } from '../../../services/marketService.js';

function fmtKm(km) {
  const n = Number(km || 0);
  try {
    return new Intl.NumberFormat('uz-UZ').format(n) + ' km';
  } catch {
    return n + ' km';
  }
}

// initialCar propini qabul qilamiz
export function AutoMarketPanel({ open, onClose, initialCar }) {
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

  // Panel ochilganda ishlaydi
  useEffect(() => {
    if (open) {
      load();
      // Agar tashqaridan mashina berilgan bo'lsa, uni tanlaymiz
      if (initialCar) {
        setSelected(initialCar);
      } else {
        setSelected(null);
      }
    }
  }, [open, initialCar]); // initialCar o'zgarganda ham ishlaydi

  const title = cfg?.title || 'Mashina bozori';

  return (
    <Modal open={open} title={title} onClose={onClose}>
      {loading && !items.length && <div className="text-sm text-gray-600 p-4 text-center">Yuklanmoqda...</div>}

      {/* 1. RO'YXAT KO'RINISHI (agar selected bo'lmasa) */}
      {!loading && !selected && (
        <div className="space-y-4">
          {mode === 'post' ? (
            <PostAdForm onDone={() => { setMode('browse'); load(); }} />
          ) : null}

          {mode === 'browse' && (
            <>
              {/* Kategoriyalar */}
              <div className="flex flex-wrap gap-2">
                {(tiles || []).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => t.action?.type === 'open_post_ad' ? setMode('post') : setMode('browse')}
                    className="rounded-full border border-gray-200 px-3 py-2 text-sm hover:bg-gray-100 bg-white"
                  >
                    {t.title?.uz || t.id}
                    {t.badge && <span className="ml-2 text-xs text-red-600 font-bold bg-red-50 px-1 rounded">{t.badge}</span>}
                  </button>
                ))}
              </div>

              {/* Mashinalar ro'yxati */}
              <div className="max-h-[65vh] overflow-y-auto space-y-3 pb-2">
                {items.map((x) => (
                  <button key={x.id} className="w-full text-left" onClick={() => setSelected(x)}>
                    <Card className="hover:shadow-md border border-gray-100 transition">
                      <CardContent className="p-3 flex gap-3">
                        <img
                          src={x.image || "/placeholder.png"}
                          alt={x.title}
                          className="h-20 w-28 rounded-lg object-cover border border-gray-200 bg-gray-50"
                        />
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="font-bold text-sm line-clamp-1">{x.title}</div>
                            <div className="text-xs text-gray-500 mt-1">{x.city} • {x.year} • {fmtKm(x.mileage_km)}</div>
                          </div>
                          <div className="mt-1 text-sm font-bold text-blue-600">{formatPriceUZS(x.price_uzs)}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                ))}
                {items.length === 0 && <div className="text-center py-6 text-gray-500">E'lonlar yo'q</div>}
              </div>

              <div className="flex justify-end border-t pt-2">
                <Button variant="secondary" onClick={onClose}>Yopish</Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* 2. BATAFSIL KO'RISH (selected bo'lsa) */}
      {!loading && selected && (
        <div className="space-y-4">
          <Card className="border-0 shadow-none">
            <CardContent className="p-0 space-y-3">
              <div className="relative">
                <img
                  src={selected.image || "/placeholder.png"}
                  alt={selected.title}
                  className="w-full h-64 rounded-xl object-cover border border-gray-100 bg-gray-100"
                />
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {selected.year} yil
                </div>
              </div>

              <div>
                <div className="text-xl font-bold">{selected.title}</div>
                <div className="text-xl font-bold text-blue-600 mt-1">{formatPriceUZS(selected.price_uzs)}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 p-2 rounded-lg">
                  <div className="text-gray-500 text-xs">Yurgani</div>
                  <div className="font-medium">{fmtKm(selected.mileage_km)}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg">
                  <div className="text-gray-500 text-xs">Shahar</div>
                  <div className="font-medium">{selected.city}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg">
                  <div className="text-gray-500 text-xs">Yoqilg‘i</div>
                  <div className="font-medium">{selected.fuel}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg">
                  <div className="text-gray-500 text-xs">KPP</div>
                  <div className="font-medium">{selected.gearbox}</div>
                </div>
              </div>

              {selected.desc && (
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-800 leading-relaxed">
                  {selected.desc}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3 border-t pt-2">
            {/* Orqaga tugmasi null qiladi, ya'ni ro'yxatga qaytaradi */}
            <Button variant="secondary" className="flex-1" onClick={() => setSelected(null)}>
              Orqaga
            </Button>
            {selected.phone ? (
              <a className="flex-1 inline-flex" href={`tel:${selected.phone}`}>
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">Qo‘ng‘iroq</Button>
              </a>
            ) : (
              <Button className="flex-1" disabled>Raqam yo‘q</Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}