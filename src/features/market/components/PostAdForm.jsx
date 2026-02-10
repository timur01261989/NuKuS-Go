import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, Button } from '../../../shared/ui/index.js';
import { getMarketParams, getMarketRemoteConfig } from '../../../services/marketMetaService.js';
import { addListing } from '../../../services/marketStorage.js';

function uid() { return 'car_' + Math.random().toString(16).slice(2) + '_' + Date.now(); }
function fmtNow() { return new Date().toISOString(); }

function compressToDataUrl(file, quality=0.75, maxW=1280) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result; };
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const out = canvas.toDataURL('image/jpeg', quality);
      resolve(out);
    };
    reader.readAsDataURL(file);
  });
}

export function PostAdForm({ onDone }) {
  const [params, setParams] = useState(null);
  const [remote, setRemote] = useState(null);
  const [saving, setSaving] = useState(false);

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('2020');
  const [mileage, setMileage] = useState('60000');
  const [price, setPrice] = useState('120000000');
  const [fuel, setFuel] = useState('Benzin');
  const [gearbox, setGearbox] = useState('Mexanika');
  const [city, setCity] = useState('Nukus');
  const [phone, setPhone] = useState('');
  const [desc, setDesc] = useState('');
  const [images, setImages] = useState([]); // dataURLs

  useEffect(() => {
    (async () => {
      const p = await getMarketParams();
      const r = await getMarketRemoteConfig();
      setParams(p);
      setRemote(r);
      if (p?.brands?.length) setBrand(p.brands[0]);
      if (p?.fuel?.length) setFuel(p.fuel[0]);
      if (p?.gearbox?.length) setGearbox(p.gearbox[0]);
      if (p?.cities?.length) setCity(p.cities[0]);
    })();
  }, []);

  const models = useMemo(() => {
    if (!params) return [];
    return params.modelsByBrand?.[brand] || [];
  }, [params, brand]);

  useEffect(() => {
    if (models.length && !models.includes(model)) setModel(models[0]);
  }, [models]);

  const maxImages = remote?.market?.post?.max_images ?? 10;
  const quality = (remote?.market?.post?.image_quality ?? 75) / 100;

  async function onPickFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const next = [...images];
    for (const f of files) {
      if (next.length >= maxImages) break;
      const dataUrl = await compressToDataUrl(f, quality);
      next.push(dataUrl);
    }
    setImages(next);
    e.target.value = '';
  }

  async function submit() {
    const requirePhone = remote?.market?.post?.require_phone ?? true;
    if (requirePhone && !phone.trim()) {
      alert('Telefon raqamni kiriting');
      return;
    }
    setSaving(true);
    try {
      const listing = {
        id: uid(),
        title: `${brand} ${model} ${year}`.trim(),
        price_uzs: Number(price || 0),
        year: Number(year || 0),
        mileage_km: Number(mileage || 0),
        fuel,
        gearbox,
        city,
        phone: phone.trim(),
        image: images[0] || '/market/sample/cobalt.svg',
        images,
        created_at: fmtNow(),
        desc: desc || 'Yangi e’lon',
        state: 'active',
        source: 'user_local'
      };
      addListing(listing);
      onDone?.(listing);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">E’lon berish (test rejim: local saqlanadi)</div>

      <Card><CardContent className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-gray-600">Marka
            <select className="mt-1 w-full rounded-lg border p-2 text-sm" value={brand} onChange={(e)=>setBrand(e.target.value)}>
              {(params?.brands||[]).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-600">Model
            <select className="mt-1 w-full rounded-lg border p-2 text-sm" value={model} onChange={(e)=>setModel(e.target.value)}>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-gray-600">Yil
            <input className="mt-1 w-full rounded-lg border p-2 text-sm" value={year} onChange={(e)=>setYear(e.target.value)} />
          </label>
          <label className="text-xs text-gray-600">Probeg (km)
            <input className="mt-1 w-full rounded-lg border p-2 text-sm" value={mileage} onChange={(e)=>setMileage(e.target.value)} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-gray-600">Yoqilg‘i
            <select className="mt-1 w-full rounded-lg border p-2 text-sm" value={fuel} onChange={(e)=>setFuel(e.target.value)}>
              {(params?.fuel||[]).map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-600">KPP
            <select className="mt-1 w-full rounded-lg border p-2 text-sm" value={gearbox} onChange={(e)=>setGearbox(e.target.value)}>
              {(params?.gearbox||[]).map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-gray-600">Shahar
            <select className="mt-1 w-full rounded-lg border p-2 text-sm" value={city} onChange={(e)=>setCity(e.target.value)}>
              {(params?.cities||[]).map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-600">Narx (so‘m)
            <input className="mt-1 w-full rounded-lg border p-2 text-sm" value={price} onChange={(e)=>setPrice(e.target.value)} />
          </label>
        </div>

        <label className="text-xs text-gray-600">Telefon
          <input className="mt-1 w-full rounded-lg border p-2 text-sm" placeholder="+998..." value={phone} onChange={(e)=>setPhone(e.target.value)} />
        </label>

        <label className="text-xs text-gray-600">Tavsif
          <textarea className="mt-1 w-full rounded-lg border p-2 text-sm" rows={3} value={desc} onChange={(e)=>setDesc(e.target.value)} />
        </label>

        <div>
          <div className="text-xs text-gray-600">Rasmlar (max {maxImages})</div>
          <input className="mt-1" type="file" accept="image/*" multiple onChange={onPickFiles} />
          {images.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-auto">
              {images.map((u,i)=> <img key={i} src={u} className="h-16 w-24 rounded-lg object-cover border" />)}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={()=>onDone?.(null)}>Bekor</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Saqlanmoqda...' : 'E’lonni saqlash'}</Button>
        </div>
      </CardContent></Card>
    </div>
  );
}