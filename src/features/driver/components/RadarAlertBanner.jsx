import React from 'react';

export default function RadarAlertBanner({ radar, severity, speedKmh = 0 }) {
  if (!radar || severity === 'idle') return null;
  const palette = severity === 'overspeed'
    ? 'bg-red-600/95 border-red-300'
    : severity === 'danger'
      ? 'bg-orange-500/95 border-orange-200'
      : severity === 'warning'
        ? 'bg-yellow-500/95 border-yellow-100 text-slate-950'
        : 'bg-sky-600/95 border-sky-200';

  return (
    <div className={`rounded-2xl border px-4 py-3 shadow-2xl text-white ${palette}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.18em]">Radar ogohlantirish</div>
      <div className="mt-1 text-lg font-bold">{radar.name || 'Oldinda radar'}</div>
      <div className="mt-1 text-sm">
        {Math.round(radar.distance)} m • limit {radar.speed_limit || '—'} • tezlik {Math.round(speedKmh || 0)}
      </div>
    </div>
  );
}
