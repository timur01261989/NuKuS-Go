import { loadConfig } from '../shared/config/configService.js';
import { defaultRoutingConfig } from '../shared/config/defaults.js';

// Routing Adapter: ORS (test) <-> Valhalla (production)
// env: VITE_ROUTING_PROVIDER='ors'|'valhalla'
// ORS: VITE_ORS_API_KEY
// Valhalla: VITE_VALHALLA_BASE_URL (http://127.0.0.1:8002)

let provider = (import.meta.env.VITE_ROUTING_PROVIDER || '').toLowerCase();
let routingCfgPromise = null;
async function getRoutingCfg(){
  if(!routingCfgPromise) routingCfgPromise = loadConfig('routing', defaultRoutingConfig);
  return routingCfgPromise;
}


function assertEnv(name) {
  const v = import.meta.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function getRoute({ start, end, profile = 'car', options = {} }) {
  const cfg = await getRoutingCfg();
  if (!provider) provider = (cfg?.provider_default || 'ors').toLowerCase();
  const prof = cfg?.profiles?.[profile] || null;
  const opts = { ...options };
  if (profile === 'truck' && prof?.truck_defaults && !opts.truck) opts.truck = prof.truck_defaults;
  if (provider === 'valhalla') return valhallaRoute({ start, end, profile, options: opts, __cfg: cfg, __prof: prof });
  return orsRoute({ start, end, profile, options: opts, __cfg: cfg, __prof: prof });
}

// Backwards-compat wrapper (below kept):
async function _deprecated_getRoute(){}


  if (provider === 'valhalla') return valhallaRoute({ start, end, profile, options });
  return orsRoute({ start, end, profile, options });
}

export async function matchTrace({ points, profile = 'car' }) {
  if (provider === 'valhalla') return valhallaTraceRoute({ points, profile });
  try { return await orsMatch({ points, profile }); } catch { return { matched: points, confidence: 0 }; }
}

// ---------- ORS ----------
async function orsRoute({ start, end, profile, options, __prof }) {
  const key = assertEnv('VITE_ORS_API_KEY');
  const mode = (__prof?.ors_mode) || (profile === 'truck' ? 'driving-hgv' : 'driving-car');
  const url = `https://api.openrouteservice.org/v2/directions/${mode}/geojson`;
  const body = {
    coordinates: [[start.lon, start.lat],[end.lon, end.lat]],
    instructions: true,
    language: (options.language || 'en'),
    units: 'km',
  };
  if (options.avoid && Array.isArray(options.avoid) && options.avoid.length) {
    body.options = body.options || {};
    body.options.avoid_features = options.avoid;
  }
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': key, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  const feature = data?.features?.[0];
  const coords = feature?.geometry?.coordinates || [];
  const summary = feature?.properties?.summary || {};
  const segments = feature?.properties?.segments || [];
  const maneuvers = segments.flatMap(s => (s.steps || [])).map(step => ({
    instruction: step.instruction,
    distance: step.distance,
    duration: step.duration,
    type: step.type,
    name: step.name,
    exit_number: step.exit_number,
  }));
  return {
    provider: 'ors',
    geometry: coords.map(([lon, lat]) => ({ lat, lon })),
    distance_m: (summary.distance || 0) * 1000,
    duration_s: (summary.duration || 0),
    maneuvers,
    raw: data,
  };
}

async function orsMatch({ points, profile }) {
  const key = assertEnv('VITE_ORS_API_KEY');
  const mode = (__prof?.ors_mode) || (profile === 'truck' ? 'driving-hgv' : 'driving-car');
  const url = `https://api.openrouteservice.org/v2/matching/${mode}/geojson`;
  const body = { coordinates: points.map(p => [p.lon, p.lat]) };
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': key, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  const feature = data?.features?.[0];
  const coords = feature?.geometry?.coordinates || [];
  return { matched: coords.map(([lon, lat]) => ({ lat, lon })), confidence: 1, raw: data };
}

// ---------- Valhalla ----------
async function valhallaRoute({ start, end, profile, options, __prof }) {
  const base = assertEnv('VITE_VALHALLA_BASE_URL').replace(/\/+$/, '');
  const costing = (__prof?.valhalla_costing) || (profile === 'truck' ? 'truck' : (profile === 'taxi' ? 'taxi' : 'auto'));
  const payload = {
    locations: [{ lat: start.lat, lon: start.lon },{ lat: end.lat, lon: end.lon }],
    costing,
    directions_options: { units: 'kilometers', language: options.language || 'en' },
  };
  if (profile === 'truck' && options.truck) payload.costing_options = { truck: options.truck };
  const r = await fetch(`${base}/route`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  const shape = data?.trip?.legs?.[0]?.shape;
  const geometry = shape ? decodePolyline6(shape) : [];
  const summary = data?.trip?.summary || {};
  const maneuvers = (data?.trip?.legs?.[0]?.maneuvers || []).map(m => ({
    instruction: m.instruction,
    distance: m.length * 1000,
    duration: m.time,
    type: m.type,
  }));
  return { provider:'valhalla', geometry, distance_m:(summary.length||0)*1000, duration_s:(summary.time||0), maneuvers, raw:data };
}

async function valhallaTraceRoute({ points, profile }) {
  const base = assertEnv('VITE_VALHALLA_BASE_URL').replace(/\/+$/, '');
  const costing = (__prof?.valhalla_costing) || (profile === 'truck' ? 'truck' : (profile === 'taxi' ? 'taxi' : 'auto'));
  const payload = {
    shape: points.map(p => ({ lat:p.lat, lon:p.lon, time:p.time })),
    costing,
    shape_match: 'map_snap',
    filters: { attributes: ['shape','confidence_score'] },
  };
  const r = await fetch(`${base}/trace_route`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  const shape = data?.trip?.legs?.[0]?.shape;
  const geometry = shape ? decodePolyline6(shape) : [];
  const conf = data?.trip?.confidence_score ?? 0;
  return { matched: geometry, confidence: conf, raw:data };
}

function decodePolyline6(str) {
  let index=0, lat=0, lon=0; const coords=[];
  while(index < str.length) {
    let b, shift=0, result=0;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1); lat += dlat;
    shift=0; result=0;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1); lon += dlng;
    coords.push({ lat: lat/1e6, lon: lon/1e6 });
  }
  return coords;
}
