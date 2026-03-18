import React from "react";

export default function FreightVehicleSetupCard({
  BODY_TYPES, loading, saving, onlineUiDisabled, title, setTitle, plateNumber, setPlateNumber, plateHint,
  bodyType, setBodyType, capacityKg, setCapacityKg, capacityM3, setCapacityM3,
  currentAddress, currentPoint, setPickerOpen, loadVehicle, saveVehicle, isOnline, toggleOnline,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4 mb-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-lg font-semibold">Mening yuk mashinam</div>
        <div className="flex items-center gap-3">
          <div className="text-sm opacity-80">ONLINE</div>
          <button type="button" disabled={onlineUiDisabled} onClick={() => toggleOnline(!isOnline)} className={["relative inline-flex h-7 w-14 items-center rounded-full transition", onlineUiDisabled ? "opacity-50" : "", isOnline ? "bg-green-600" : "bg-gray-600"].join(" ")} title={isOnline ? "Online (o‘chirish)" : "Offline (yoqish)"}>
            <span className={["inline-block h-6 w-6 transform rounded-full bg-white transition", isOnline ? "translate-x-7" : "translate-x-1"].join(" ")} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm opacity-80 mb-1">Nom (ixtiyoriy)</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 outline-none" placeholder="Masalan: Gazel" />
        </div>
        <div>
          <label className="block text-sm opacity-80 mb-1">Davlat raqami</label>
          <input value={plateNumber} onChange={(e) => setPlateNumber((e.target.value || "").toUpperCase().replace(/\s+/g, "").slice(0, 9))} maxLength={9} className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 outline-none" placeholder="01A123BC" />
          <div className="text-xs opacity-70 mt-1">{plateHint}</div>
        </div>
        <div>
          <label className="block text-sm opacity-80 mb-1">Turi</label>
          <select value={bodyType} onChange={(e) => setBodyType(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 outline-none">
            {BODY_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="text-xs opacity-70 mt-1">Faol yuklar siz tanlagan turga qarab keladi.</div>
        </div>
        <div>
          <label className="block text-sm opacity-80 mb-1">Sig‘imi</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <input value={capacityKg} onChange={(e) => setCapacityKg(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 outline-none" placeholder="1500" inputMode="numeric" />
              <div className="text-sm opacity-70">kg</div>
            </div>
            <div className="flex items-center gap-2">
              <input value={capacityM3} onChange={(e) => setCapacityM3(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 outline-none" placeholder="8.0" inputMode="decimal" />
              <div className="text-sm opacity-70">m³</div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="text-sm opacity-80 mb-1">Joylashuv</div>
        <div className="text-sm">{currentAddress || "—"}</div>
        {currentPoint && <div className="mt-1 text-xs opacity-70 font-mono">{currentPoint.lat.toFixed(6)}, {currentPoint.lng.toFixed(6)}</div>}
        {!currentPoint && <div className="mt-1 text-xs text-yellow-300">Online bo‘lish uchun joylashuvni tanlang.</div>}
        <div className="mt-2"><button type="button" onClick={() => setPickerOpen(true)} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10">Xaritadan tanlash</button></div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2">
        <button type="button" onClick={loadVehicle} disabled={loading || saving} className="px-4 py-2 rounded-lg bg-gray-700 text-white disabled:opacity-50">Yangilash</button>
        <button type="button" onClick={saveVehicle} disabled={loading || saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50">{saving ? "Saqlanmoqda..." : "SAQLASH"}</button>
      </div>
    </div>
  );
}