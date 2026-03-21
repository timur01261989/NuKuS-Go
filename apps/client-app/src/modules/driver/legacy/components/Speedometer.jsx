import React from 'react';

export default function Speedometer({ speedKmh = 0, speedLimit = null, online = false }) {
  const overspeed = Number.isFinite(speedLimit) && speedKmh > speedLimit;
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/85 text-white shadow-2xl backdrop-blur px-4 py-3 min-w-[126px]">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-300">{online ? 'Drive mode' : 'Offline'}</div>
      <div className={`text-4xl font-black leading-none mt-1 ${overspeed ? 'text-red-400' : 'text-white'}`}>{Math.round(speedKmh || 0)}</div>
      <div className="mt-1 flex items-center justify-between text-xs text-slate-300">
        <span>km/soat</span>
        <span>{Number.isFinite(speedLimit) ? `Limit ${speedLimit}` : 'Limit —'}</span>
      </div>
    </div>
  );
}
