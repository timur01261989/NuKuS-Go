import { useEffect, useState } from 'react';
import { startTracking, stopTracking, getLatestTrackingPosition } from '../components/services/locationService';
import { smoothSpeed } from './speedUtils';

export function useSpeedometer({ enabled }) {
  const [speedKmh, setSpeedKmh] = useState(0);
  const [position, setPosition] = useState({ lat: null, lng: null });
  const [heading, setHeading] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setSpeedKmh(0);
      return;
    }

    const apply = (pos = {}) => {
      const lat = pos?.lat ?? null;
      const lng = pos?.lng ?? null;
      const nextHeading = Number.isFinite(pos?.heading) ? pos.heading : null;
      const nextSpeed = Number.isFinite(pos?.speed) ? pos.speed : 0;

      setPosition({ lat, lng });
      setHeading(nextHeading);
      setSpeedKmh((prev) => {
        const smoothed = smoothSpeed(prev, nextSpeed);
        return smoothed < 3 ? 0 : Math.round(smoothed);
      });
    };

    apply(getLatestTrackingPosition());
    startTracking(apply);

    return () => {
      stopTracking(apply);
    };
  }, [enabled]);

  return { speedKmh, position, heading };
}
