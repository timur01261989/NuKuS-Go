import { loadConfig } from '../shared/config/configService.js';
import { defaultRoutingConfig } from '../shared/config/defaults.js';
import { getRoute, matchTrace } from './routingAdapter.js';

function distM(a,b){
  const R=6371000, toRad=(x)=>x*Math.PI/180;
  const dLat=toRad(b.lat-a.lat), dLon=toRad(b.lon-a.lon);
  const lat1=toRad(a.lat), lat2=toRad(b.lat);
  const s=Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(s));
}

function pointToLineDistanceM(p,line){
  if(!line || line.length<2) return Infinity;
  const x=(lon,lat)=>lon*Math.cos((lat*Math.PI)/180);
  let best=Infinity;
  for(let i=0;i<line.length-1;i++){
    const a=line[i], b=line[i+1];
    const ax=x(a.lon,a.lat), ay=a.lat;
    const bx=x(b.lon,b.lat), by=b.lat;
    const px=x(p.lon,p.lat), py=p.lat;
    const dx=bx-ax, dy=by-ay;
    const t=(dx===0 && dy===0)?0:((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy);
    const tt=Math.max(0,Math.min(1,t));
    const cx=ax+tt*dx, cy=ay+tt*dy;
    const clLon=cx/Math.cos((cy*Math.PI)/180);
    best=Math.min(best, distM({lat:p.lat,lon:p.lon},{lat:cy,lon:clLon}));
  }
  return best;
}

export function createNavigator({ profile='car', rerouteMinIntervalMs=8000, offRouteThresholdM=45, onVoice } = {}){
  let cfgPromise = null;
  async function getCfg(){
    if(!cfgPromise) cfgPromise = loadConfig('routing', defaultRoutingConfig);
    return cfgPromise;
  }

  let currentRoute=null;
  let lastRerouteAt=0;
  let maneuverIndex=0;

  async function plan(start,end,options={}){
    currentRoute = await getRoute({ start, end, profile, options });
    maneuverIndex=0;
    return currentRoute;
  }

  async function updatePosition(pos,end,options={}){
    const cfg = await getCfg();
    const rr = cfg?.reroute || {};
    const _offRouteThresholdM = (offRouteThresholdM===45 && rr.offRouteThresholdM!=null) ? rr.offRouteThresholdM : offRouteThresholdM;
    const _rerouteMinIntervalMs = (rerouteMinIntervalMs===8000 && rr.minIntervalMs!=null) ? rr.minIntervalMs : rerouteMinIntervalMs;

    if(!currentRoute) return { status:'no_route' };
    const d = pointToLineDistanceM(pos, currentRoute.geometry);
    const now=Date.now();

    if(d>_offRouteThresholdM && (now-lastRerouteAt)>_rerouteMinIntervalMs){
      lastRerouteAt=now;
      try{
        const matched = await matchTrace({ points:[pos], profile });
        const start2 = matched?.matched?.[0] || pos;
        currentRoute = await getRoute({ start:start2, end, profile, options });
      }catch{
        currentRoute = await getRoute({ start:pos, end, profile, options });
      }
      maneuverIndex=0;
      return { status:'rerouted', route: currentRoute, offRouteMeters:d };
    }

    const m = currentRoute.maneuvers?.[maneuverIndex];
    if(m && typeof onVoice === 'function'){
      if(m.distance != null && m.distance < 60){
        onVoice(m.instruction, m);
        maneuverIndex += 1;
      }
    }

    return { status:'ok', route: currentRoute, offRouteMeters:d, maneuverIndex };
  }

  function getState(){ return { currentRoute, maneuverIndex, lastRerouteAt }; }
  return { plan, updatePosition, getState };
}
