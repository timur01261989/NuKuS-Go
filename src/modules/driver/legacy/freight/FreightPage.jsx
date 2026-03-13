import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { nominatimReverse } from "@/modules/client/features/client/shared/geo/nominatim.js";
import { supabase } from "@/services/supabase/supabaseClient";
import { useDriverOnline } from "../core/useDriverOnline";
import { canActivateService } from "../core/serviceGuards";
import UnifiedParcelFeed from "../delivery-integration/feed/UnifiedParcelFeed";
import { IntegrationProvider } from "../delivery-integration/context/IntegrationContext";
import {
  canUseOrderTypeInArea,
  clampLoadToVehicle,
} from "../core/driverCapabilityService";

/**
 * DriverFreight.jsx (FULL)
 * Driver taraf — Yuk tashish:
 * ✅ Mashina turi 5 ta variant
 * ✅ Joylashuvni xaritadan tanlash (pin markazda)
 * ✅ Joylashuv manzil nomi ko‘rinadi (reverse geocode)
 * ✅ Online tugma ishlaydi (online bo‘lish uchun joylashuv shart)
 * ✅ Davlat raqami: max 9 belgi, avtomatik KATTA harf
 *
 * Eslatma:
 * - DBda current_point JSON {lat,lng} sifatida saqlanadi.
 * - Manzil nomi DBga yozilmaydi (schema’da ustun bo‘lmasa). UI’da ko‘rsatiladi.
 */

const BODY_TYPES = [
  { value: "motoroller", label: "Motoruller" },
  { value: "labo_damas", label: "Labo / Damas" },
  { value: "gazel", label: "Gazel" },
  { value: "isuzu_kamaz", label: "Isuzu / Kamaz" },
  { value: "fura", label: "Fura" },
];

function normalizePoint(point) {
  if (!point) return null;

  // json {lat,lng}
  if (typeof point === "object" && !Array.isArray(point)) {
    const lat = point.lat ?? point.latitude ?? null;
    const lng = point.lng ?? point.lon ?? point.longitude ?? null;
    if (lat != null && lng != null) return { lat: Number(lat), lng: Number(lng) };
  }

  // [lng, lat]
  if (Array.isArray(point) && point.length >= 2) {
    return { lng: Number(point[0]), lat: Number(point[1]) };
  }

  // "POINT(lng lat)"
  if (typeof point === "string") {
    const m = point.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (m) return { lng: Number(m[1]), lat: Number(m[2]) };
  }

  return null;
}

function pointToDbValue(p) {
  if (!p) return null;
  return { lat: Number(p.lat), lng: Number(p.lng) };
}

/** ----------------------------- Map helpers ----------------------------- */
function FlyTo({ target, zoom = 16 }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo(target, zoom, { animate: true, duration: 1.0 });
  }, [target, zoom, map]);
  return null;
}

function CenterTracker({ enabled, onCenter, setIsDragging }) {
  const map = useMap();
  useEffect(() => {
    if (!enabled) return;
    const onMoveStart = () => setIsDragging(true);
    const onMoveEnd = () => {
      setIsDragging(false);
      const c = map.getCenter();
      onCenter({ lat: c.lat, lng: c.lng });
    };
    map.on("movestart", onMoveStart);
    map.on("moveend", onMoveEnd);
    return () => {
      map.off("movestart", onMoveStart);
      map.off("moveend", onMoveEnd);
    };
  }, [enabled, map, onCenter, setIsDragging]);
  return null;
}

function MapClickPick({ enabled, onPick }) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

const pinSvg = () => `
<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="20" fill="#3B82F6"/>
  <path d="M36 19c-4 0-7 3-7 7v10l-2 2v3h14v-3l-2-2V26c0-4-3-7-7-7z" fill="#fff"/>
</svg>`;

function LocationPickerModal({ open, initialPoint, onCancel, onSave }) {
  const [center, setCenter] = useState(() => {
    if (initialPoint?.lat != null && initialPoint?.lng != null) return [initialPoint.lat, initialPoint.lng];
    return [41.31, 69.24]; // Tashkent default
  });
  const [isDragging, setIsDragging] = useState(false);
  const [picked, setPicked] = useState(() => (initialPoint ? { ...initialPoint } : null));
  const [address, setAddress] = useState("");
  const [addrLoading, setAddrLoading] = useState(false);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    // reverse initial
    if (initialPoint?.lat != null && initialPoint?.lng != null) {
      setPicked({ ...initialPoint });
      setCenter([initialPoint.lat, initialPoint.lng]);
    }
  }, [open, initialPoint]);

  const reverse = useCallback(async (p) => {
    if (!p) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch {}
      abortRef.current = null;
    }
    debounceRef.current = setTimeout(async () => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setAddrLoading(true);
      try {
        const a = await nominatimReverse(p.lat, p.lng, { signal: ctrl.signal, swallowErrors: true });
        if (!ctrl.signal.aborted) setAddress(a || "");
      } catch {
        // ignore
      } finally {
        if (!ctrl.signal.aborted) setAddrLoading(false);
      }
    }, 220);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (picked) reverse(picked);
  }, [open, picked, reverse]);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPicked(p);
        setCenter([p.lat, p.lng]);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/60">
      <div className="w-full md:w-[920px] md:rounded-2xl bg-[#0b1220] border border-white/10 overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
          <div className="font-semibold">Joylashuvni xaritadan tanlang</div>
          <button onClick={onCancel} className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15">Yopish</button>
        </div>

        <div className="p-3">
          <div className="relative rounded-xl overflow-hidden border border-white/10" style={{ height: "56vh" }}>
            <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              <FlyTo target={center} zoom={16} />
              <CenterTracker
                enabled={true}
                setIsDragging={setIsDragging}
                onCenter={(p) => setPicked(p)}
              />
              <MapClickPick
                enabled={true}
                onPick={(p) => {
                  setCenter([p.lat, p.lng]);
                  setPicked(p);
                }}
              />
            </MapContainer>

            {/* center pin */}
            <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[calc(50%+18px)] pointer-events-none ${isDragging ? "opacity-80" : "opacity-100"}`}>
              <div style={{ width: 70, height: 80 }} dangerouslySetInnerHTML={{ __html: pinSvg() }} />
            </div>

            {/* locate */}
            <button
              type="button"
              onClick={locateMe}
              className="absolute right-3 top-3 z-[900] px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10"
            >
              Men
            </button>
          </div>

          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-sm opacity-80 mb-1">Tanlangan manzil</div>
            <div className="text-sm">
              {addrLoading ? "Manzil aniqlanmoqda..." : (address || "—")}
            </div>
            {picked && (
              <div className="mt-1 text-xs opacity-70 font-mono">
                {picked.lat.toFixed(6)}, {picked.lng.toFixed(6)}
              </div>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10"
            >
              Bekor
            </button>
            <button
              onClick={() => onSave(picked, address)}
              disabled={!picked}
              className="flex-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
            >
              Manzilni saqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ----------------------------- Component ----------------------------- */
export default function FreightPage() {
  const { isOnline: globalOnline, activeService, setOnline, setOffline, activeVehicle, serviceTypes, refreshCapabilities } = useDriverOnline();
  const serviceType = "freight";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);

  const [vehicleId, setVehicleId] = useState(null);

  const [title, setTitle] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [bodyType, setBodyType] = useState("gazel");
  const [capacityKg, setCapacityKg] = useState("");
  const [capacityM3, setCapacityM3] = useState("");
  const [isOnline, setIsOnline] = useState(false);

  const [currentPoint, setCurrentPoint] = useState(null);
  const [currentAddress, setCurrentAddress] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const freightEnabled = useMemo(() => canUseOrderTypeInArea({ serviceTypes }, "city", "freight"), [serviceTypes]);
  const deliveryEnabled = useMemo(() => canUseOrderTypeInArea({ serviceTypes }, "city", "delivery"), [serviceTypes]);
  const vehicleLimits = useMemo(() => clampLoadToVehicle({ activeVehicle }, Number(capacityKg || 0), Number(capacityM3 || 0)), [activeVehicle, capacityKg, capacityM3]);

  const mountedRef = useRef(false);

  const clearMsgs = useCallback(() => {
    setError("");
    setInfo("");
  }, []);

  const loadVehicle = useCallback(async () => {
    clearMsgs();
    setLoading(true);

    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const uid = authData?.user?.id;
      if (!uid) throw new Error("Login bo‘lmagan: user topilmadi.");

      if (activeVehicle?.id) {
        const mapped = {
          id: activeVehicle.id,
          title: activeVehicle.brand || activeVehicle.model || "",
          plate_number: activeVehicle.plateNumber || "",
          body_type: activeVehicle.vehicleType || "gazel",
          capacity_kg: activeVehicle.maxWeightKg || null,
          capacity_m3: activeVehicle.maxVolumeM3 || null,
          is_online: !!globalOnline && activeService === serviceType,
          current_point: null,
        };
        const v = mapped;
        setVehicleId(v.id || null);
        setTitle(v.title || "");
        setPlateNumber((v.plate_number || "").toUpperCase().slice(0, 9));
        setBodyType(v.body_type || "gazel");
        setCapacityKg(v.capacity_kg != null ? String(v.capacity_kg) : "");
        setCapacityM3(v.capacity_m3 != null ? String(v.capacity_m3) : "");
        setIsOnline(!!v.is_online && globalOnline && activeService === serviceType);
        setCurrentPoint(null);
        setCurrentAddress("");
        setLoading(false);
        return;
      }

      const { data: vehicles, error: vErr } = await supabase
        .from("vehicles")
        .select(
          "id, user_id, driver_id, title, plate_number, body_type, vehicle_type, capacity_kg, capacity_m3, max_weight_kg, max_volume_m3, is_online, current_point, updated_at"
        )
        .or(`user_id.eq.${uid},driver_id.eq.${uid}`)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (vErr) throw vErr;

      const v = vehicles?.[0] || null;

      if (!v) {
        setVehicleId(null);
        setIsOnline(false);
        setCurrentPoint(null);
        setCurrentAddress("");
        setLoading(false);
        return;
      }

      setVehicleId(v.id || null);
      setTitle(v.title || "");
      setPlateNumber((v.plate_number || "").toUpperCase().slice(0, 9));
      setBodyType(v.body_type || "gazel");
      setCapacityKg(v.capacity_kg != null ? String(v.capacity_kg) : "");
      setCapacityM3(v.capacity_m3 != null ? String(v.capacity_m3) : "");
      setIsOnline(!!v.is_online && globalOnline && activeService === serviceType);

      const p = normalizePoint(v.current_point);
      setCurrentPoint(p);

      // address ni DBdan ololmaymiz (schema yo‘q) — reverse qilib UI’ga chiqaramiz
      if (p?.lat != null && p?.lng != null) {
        const addr = await nominatimReverse(p.lat, p.lng, { swallowErrors: true });
        setCurrentAddress(addr || "");
      } else {
        setCurrentAddress("");
      }

      setLoading(false);
      await Promise.resolve(refreshCapabilities?.()).catch(() => {});
    } catch (e) {
      console.error(e);
      setLoading(false);
      setError(e?.message || "Xatolik yuz berdi.");
    }
  }, [activeService, activeVehicle, clearMsgs, globalOnline]);

  useEffect(() => {
    mountedRef.current = true;
    loadVehicle();
    return () => {
      mountedRef.current = false;
    };
  }, [loadVehicle]);

  const saveVehicle = useCallback(async () => {
    clearMsgs();
    setSaving(true);

    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const uid = authData?.user?.id;
      if (!uid) throw new Error("Login bo‘lmagan: user topilmadi.");

      if (!bodyType) throw new Error("Moshina turini tanlang.");
      if (!plateNumber.trim()) throw new Error("Davlat raqamini kiriting.");

      const payload = {
        user_id: uid,
        driver_id: uid,
        title: title?.trim() || null,
        plate_number: plateNumber?.trim().toUpperCase().slice(0, 9),
        body_type: bodyType,
        capacity_kg: capacityKg === "" ? null : Number(capacityKg),
        capacity_m3: capacityM3 === "" ? null : Number(capacityM3),
        current_point: pointToDbValue(currentPoint),
        is_online: !!(globalOnline && activeService === serviceType),
        updated_at: new Date().toISOString(),
      };

      if (vehicleId) {
        const { error: upErr } = await supabase.from("vehicles").update(payload).eq("id", vehicleId);
        if (upErr) throw upErr;
        setInfo("Saqlandi.");
      } else {
        const { data: ins, error: insErr } = await supabase
          .from("vehicles")
          .insert(payload)
          .select("id")
          .limit(1)
          .single();

        if (insErr) throw insErr;

        setVehicleId(ins?.id || null);
        setInfo("Yangi mashina yaratildi.");
      }
    } catch (e) {
      console.error(e);
      setError(e?.message || "Saqlashda xato.");
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [bodyType, capacityKg, capacityM3, clearMsgs, currentPoint, isOnline, plateNumber, title, vehicleId]);


const toggleOnline = useCallback(
  async (next) => {
    clearMsgs();

    if (next === true) {
      if (!canActivateService(activeService, serviceType)) {
        setError("Avval boshqa xizmatni offline qiling.");
        return;
      }
      if (!freightEnabled) {
        setError("Yuk tashish xizmati Sozlamalarda yoqilmagan.");
        return;
      }
      if (!currentPoint && !activeVehicle) {
        setError("Online bo‘lish uchun avval Joylashuvni xaritadan tanlang.");
        return;
      }
      if (!vehicleId) {
        setError("Online yoqishdan oldin avval 'SAQLASH' qilib mashinani yaratib oling.");
        return;
      }
    }

    setTogglingOnline(true);

    try {
      if (!vehicleId) throw new Error("Vehicle topilmadi. Avval 'SAQLASH' qiling.");

      const { error: upErr } = await supabase
        .from("vehicles")
        .update({
          is_online: !!next,
          current_updated_at: currentPoint ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vehicleId);

      if (upErr) throw upErr;

      if (next) await setOnline(serviceType);
      else await setOffline();

      setIsOnline(!!next);
      setInfo(next ? "Online yoqildi." : "Offline qilindi.");
    } catch (e) {
      console.error(e);
      setError(e?.message || "Online o‘zgartirishda xato.");
    } finally {
      if (mountedRef.current) setTogglingOnline(false);
    }
  },
  [activeService, activeVehicle, clearMsgs, currentPoint, freightEnabled, refreshCapabilities, setOffline, setOnline, vehicleId]
);

useEffect(() => {
  setIsOnline(!!globalOnline && activeService === serviceType);
}, [globalOnline, activeService]);

const onlineUiDisabled = useMemo(() => loading || saving || togglingOnline, [loading, saving, togglingOnline]);

  const plateHint = useMemo(() => {
    const v = plateNumber.trim();
    if (!v) return "Masalan: 01A123BC (9 ta belgigacha)";
    if (v.length > 9) return "Davlat raqami 9 ta belgidan oshmasligi kerak.";
    return "9 ta belgigacha, avtomatik KATTA harf.";
  }, [plateNumber]);

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-xl font-semibold">YUK TASHISH (HAYDOVCHI)</div>
          <div className="text-sm opacity-80">Moshina turini tanlang → joylashuvni xaritadan saqlang → online bo‘ling.</div>
        </div>

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50"
        >
          Joylashuv
        </button>
      </div>

      {(error || info) && (
        <div className="mb-4 space-y-2">
          {error && <div className="px-4 py-3 rounded-lg bg-red-900/40 border border-red-500 text-red-100">{error}</div>}
          {info && <div className="px-4 py-3 rounded-lg bg-green-900/30 border border-green-500 text-green-100">{info}</div>}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 mb-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-lg font-semibold">Mening yuk mashinam</div>

          <div className="flex items-center gap-3">
            <div className="text-sm opacity-80">ONLINE</div>
            <button
              type="button"
              disabled={onlineUiDisabled}
              onClick={() => toggleOnline(!isOnline)}
              className={[
                "relative inline-flex h-7 w-14 items-center rounded-full transition",
                onlineUiDisabled ? "opacity-50" : "",
                isOnline ? "bg-green-600" : "bg-gray-600",
              ].join(" ")}
              title={isOnline ? "Online (o‘chirish)" : "Offline (yoqish)"}
            >
              <span
                className={[
                  "inline-block h-6 w-6 transform rounded-full bg-white transition",
                  isOnline ? "translate-x-7" : "translate-x-1",
                ].join(" ")}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm opacity-80 mb-1">Nom (ixtiyoriy)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 outline-none"
              placeholder="Masalan: Gazel"
            />
          </div>

          <div>
            <label className="block text-sm opacity-80 mb-1">Davlat raqami</label>
            <input
              value={plateNumber}
              onChange={(e) => {
                const v = (e.target.value || "").toUpperCase().replace(/\s+/g, "");
                setPlateNumber(v.slice(0, 9));
              }}
              maxLength={9}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 outline-none"
              placeholder="01A123BC"
            />
            <div className="text-xs opacity-70 mt-1">{plateHint}</div>
          </div>

          <div>
            <label className="block text-sm opacity-80 mb-1">Turi</label>
            <select
              value={bodyType}
              onChange={(e) => setBodyType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 outline-none"
            >
              {BODY_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <div className="text-xs opacity-70 mt-1">Faol yuklar siz tanlagan turga qarab keladi.</div>
          </div>

          <div>
            <label className="block text-sm opacity-80 mb-1">Sig‘imi</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <input
                  value={capacityKg}
                  onChange={(e) => setCapacityKg(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 outline-none"
                  placeholder="1500"
                  inputMode="numeric"
                />
                <div className="text-sm opacity-70">kg</div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  value={capacityM3}
                  onChange={(e) => setCapacityM3(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 outline-none"
                  placeholder="8.0"
                  inputMode="decimal"
                />
                <div className="text-sm opacity-70">m³</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-sm opacity-80 mb-1">Joylashuv</div>
          <div className="text-sm">{currentAddress || "—"}</div>
          {currentPoint && (
            <div className="mt-1 text-xs opacity-70 font-mono">
              {currentPoint.lat.toFixed(6)}, {currentPoint.lng.toFixed(6)}
            </div>
          )}
          {!currentPoint && <div className="mt-1 text-xs text-yellow-300">Online bo‘lish uchun joylashuvni tanlang.</div>}
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10"
            >
              Xaritadan tanlash
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={loadVehicle}
            disabled={loading || saving}
            className="px-4 py-2 rounded-lg bg-gray-700 text-white disabled:opacity-50"
          >
            Yangilash
          </button>

          <button
            type="button"
            onClick={saveVehicle}
            disabled={loading || saving}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
          >
            {saving ? "Saqlanmoqda..." : "SAQLASH"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <div className="text-lg font-semibold">Mos yuklar</div>
            <div className="text-sm opacity-70">Online bo‘lsangiz va tur tanlangan bo‘lsa — mos yuklar chiqadi.</div>
          </div>
          <div className="text-sm px-3 py-1 rounded-full border border-white/10">{isOnline ? "Online" : "Offline"}</div>
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
        <div className="text-xs opacity-70">Bu sahifa endi haydovchi sozlamalari va aktiv mashina sig‘imi bilan bog‘langan. Sig‘imdan katta yuklar feedga chiqmaydi.</div>
      </div>

      <IntegrationProvider initialState={{ enabled: isOnline, driverMode: "CITY", capacity: { maxWeightKg: Number(vehicleLimits.maxWeightKg || 0), maxVolumeM3: Number(vehicleLimits.maxVolumeM3 || 0) } }}>
        <UnifiedParcelFeed
          supabase={supabase}
          driverId={vehicleId || activeVehicle?.id || null}
          driverMode="CITY"
          vehiclePlate={plateNumber || activeVehicle?.plateNumber || ""}
          parcelFilter={{
            serviceArea: "city",
            orderType: "freight",
            maxWeightKg: Number(vehicleLimits.maxWeightKg || 0),
            maxVolumeM3: Number(vehicleLimits.maxVolumeM3 || 0),
          }}
        />
      </IntegrationProvider>

      <LocationPickerModal
        open={pickerOpen}
        initialPoint={currentPoint}
        onCancel={() => setPickerOpen(false)}
        onSave={async (p, addr) => {
          setPickerOpen(false);
          if (!p) return;

          setCurrentPoint(p);
          setCurrentAddress(addr || "");

          // DBga darrov yozish (vehicle bo‘lsa)
          try {
            if (vehicleId) {
              await supabase
                .from("vehicles")
                .update({
                  current_point: pointToDbValue(p),
                  current_updated_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq("id", vehicleId);
            }
          } catch {
            // ignore
          }
        }}
      />
    </div>
  );
}