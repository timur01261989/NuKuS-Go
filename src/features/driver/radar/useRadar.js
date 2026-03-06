import { useEffect, useMemo, useState } from 'react';
import { playRadarAlert, shouldPlayRadarAlert } from './alertManager';
import { loadRadarData } from './radarData';
import { findNearestRadar, getRadarSeverity } from './radarEngine';

export function useRadar({ enabled, position, heading, speedKmh }) {
  const [radars, setRadars] = useState([]);
  const [nearest, setNearest] = useState(null);
  const [severity, setSeverity] = useState('idle');

  useEffect(() => {
    let alive = true;
    loadRadarData().then((items) => {
      if (alive) setRadars(items || []);
    });
    return () => {
      alive = false;
    };
  }, []);

  const current = useMemo(() => {
    if (!enabled) return null;
    return findNearestRadar({ position, heading, radars });
  }, [enabled, position?.lat, position?.lng, heading, radars]);

  useEffect(() => {
    if (!enabled || !current) {
      setNearest(null);
      setSeverity('idle');
      return;
    }
    const nextSeverity = getRadarSeverity(current.distance, speedKmh, current.speed_limit);
    setNearest(current);
    setSeverity(nextSeverity);
    if (shouldPlayRadarAlert(current.id, nextSeverity)) {
      playRadarAlert();
    }
  }, [enabled, current, speedKmh]);

  return { nearestRadar: nearest, radarSeverity: severity, radarCount: radars.length };
}
