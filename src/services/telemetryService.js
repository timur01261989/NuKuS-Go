const KEY = "nukusgo_telemetry_v1";
function load(){ try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } }
function save(arr){ try { localStorage.setItem(KEY, JSON.stringify(arr.slice(-5000))); } catch {} }
export function track(event){ const arr=load(); arr.push({ ...event, ts: Date.now() }); save(arr); }
export function getTelemetry(){ return load(); }
export function clearTelemetry(){ localStorage.removeItem(KEY); }
export function estimateETAFromHistory(distanceM, fallbackSeconds){
  const arr=load();
  const speeds=arr.filter(e=>e.type==='move' && typeof e.speedMps==='number').slice(-500).map(e=>e.speedMps).filter(s=>s>1);
  if(speeds.length<30) return fallbackSeconds;
  const avg=speeds.reduce((a,b)=>a+b,0)/speeds.length;
  return Math.max(10, Math.round(distanceM/avg));
}
