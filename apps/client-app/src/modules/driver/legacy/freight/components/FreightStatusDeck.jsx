import React from "react";

export default function FreightStatusDeck({ isOnline, freightEnabled, deliveryEnabled, vehicleLimits, connectionMeta = null, heartbeatMeta = null }) {
  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <div className="text-lg font-semibold">Mos yuklar</div>
            <div className="text-sm opacity-70">Online bo‘lsangiz va tur tanlangan bo‘lsa — mos yuklar chiqadi.</div>
          </div>
          <div className="text-sm px-3 py-1 rounded-full border border-white/10">{isOnline ? "Online" : "Offline"}</div>
          {connectionMeta?.state ? <div className="text-xs px-3 py-1 rounded-full border border-white/10">{connectionMeta.state}</div> : null}
        </div>
        <div className="text-sm opacity-70 mt-2">
          {isOnline ? "Online: mos yuklar ko‘rinishi kerak." : "Offline: haydovchi topilmasin (yuklar yashirin)."}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <div className="text-sm px-3 py-1 rounded-full border border-white/10">Shahar yuk: {freightEnabled ? "yoqilgan" : "o‘chiq"}</div>
          <div className="text-sm px-3 py-1 rounded-full border border-white/10">Shahar eltish: {deliveryEnabled ? "yoqilgan" : "o‘chiq"}</div>
          <div className="text-sm px-3 py-1 rounded-full border border-white/10">Aktiv limit: {Number(vehicleLimits.maxWeightKg || 0)}kg / {Number(vehicleLimits.maxVolumeM3 || 0)}m³</div>
        </div>
        {(heartbeatMeta?.isEventStale || heartbeatMeta?.isLocationStale) ? (
          <div className="text-xs text-amber-300 mt-2">Realtime yoki joylashuv yangilanishi sustlashgan.</div>
        ) : null}
        <div className="text-xs opacity-70">Bu sahifa endi haydovchi sozlamalari va aktiv mashina sig‘imi bilan bog‘langan. Sig‘imdan katta yuklar feedga chiqmaydi.</div>
      </div>
    </>
  );
}