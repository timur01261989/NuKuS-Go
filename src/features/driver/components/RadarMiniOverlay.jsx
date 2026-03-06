import React from 'react';
import Speedometer from './Speedometer';
import RadarAlertBanner from './RadarAlertBanner';

export default function RadarMiniOverlay({ online, speedKmh, radar, severity }) {
  if (!online) return null;
  return (
    <div className="fixed right-4 bottom-24 z-[1200] flex flex-col gap-3 pointer-events-none">
      <div className="pointer-events-auto">
        <Speedometer speedKmh={speedKmh} speedLimit={radar?.speed_limit ?? null} online={online} />
      </div>
      {radar ? (
        <div className="max-w-[260px] pointer-events-auto">
          <RadarAlertBanner radar={radar} severity={severity} speedKmh={speedKmh} />
        </div>
      ) : null}
    </div>
  );
}
