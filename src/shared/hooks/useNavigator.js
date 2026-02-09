import { useMemo, useRef, useState } from 'react';
import { createNavigator } from '../../services/navigatorEngine.js';
import { track, estimateETAFromHistory } from '../../services/telemetryService.js';

export function useNavigator({ profile='car', onVoice } = {}){
  let _onVoice = onVoice;
  if (!_onVoice) {
    _onVoice = (text) => import('../../services/voiceService.js').then(m => m.speak(text)).catch(()=>{});
  }

  const nav = useMemo(() => createNavigator({ profile, onVoice: _onVoice }), [profile, onVoice]);
  const [state, setState] = useState({ route:null, status:'idle', eta_s:null });
  const endRef = useRef(null);

  async function plan(start,end,options){
    endRef.current = end;
    const route = await nav.plan(start,end,options);
    const eta = estimateETAFromHistory(route.distance_m, route.duration_s);
    setState({ route, status:'planned', eta_s: eta });
    track({ type:'route_planned', profile, distance_m: route.distance_m, duration_s: route.duration_s });
    return route;
  }

  async function updatePosition(pos, options){
    const end = endRef.current;
    if(!end) return;
    const res = await nav.updatePosition(pos, end, options);
    if(res.status === 'rerouted'){
      const eta = estimateETAFromHistory(res.route.distance_m, res.route.duration_s);
      setState({ route: res.route, status:'rerouted', eta_s: eta });
      track({ type:'reroute', offRouteMeters: res.offRouteMeters });
    } else if(res.status === 'ok'){
      setState((s)=>({ ...s, status:'ok' }));
      track({ type:'move', offRouteMeters: res.offRouteMeters, speedMps: pos.speedMps });
    }
    return res;
  }

  return { ...state, plan, updatePosition };
}
