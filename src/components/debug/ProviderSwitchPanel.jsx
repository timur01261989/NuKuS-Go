import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '../../shared/ui/index.js';
import { getProviderConfig, setProviderConfig } from '../../services/providerConfig.js';

const opts = {
  map_provider: ['OSM', 'YANDEX', 'GOOGLE'],
  route_provider: ['OSRM', 'YANDEX', 'GOOGLE'],
  traffic_provider: ['NONE', 'YANDEX', 'GOOGLE'],
};

export function ProviderSwitchPanel() {
  const cur = useMemo(()=>getProviderConfig(), []);
  const [cfg, setCfg] = useState(cur);
  const [saved, setSaved] = useState(false);

  function setField(k,v){
    setSaved(false);
    setCfg(prev=>({ ...prev, [k]: v }));
  }

  function save(){
    setProviderConfig(cfg);
    setSaved(true);
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">Providers (Debug) — default OSM/OSRM</div>
      <Card>
        <CardContent className="p-3 space-y-3">
          {Object.keys(opts).map((k)=>(
            <label key={k} className="block text-xs text-gray-600">
              {k}
              <select className="mt-1 w-full rounded-lg border p-2 text-sm"
                value={cfg[k] || ''}
                onChange={(e)=>setField(k, e.target.value)}
              >
                {opts[k].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
          ))}
          <button className="rounded-lg border px-3 py-2 text-sm" onClick={save}>Saqlash</button>
          <div className="text-xs text-gray-500">
            {saved ? 'Saqlandi. Sahifani yangilang (refresh).' : 'Saqla va refresh qiling.'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
