import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";

/**
 * Driver Freight (Yuk tashish - haydovchi) sahifasi
 * - Vehicles jadvalidan driver_id bo‘yicha mashinani topadi (eng oxirgi updated_at).
 * - Yo‘q bo‘lsa: "Saqlash" bosilganda yangi vehicle yaratadi.
 * - Online toggle: is_online ni update qiladi.
 * - Online ON qilish uchun current_point bo‘lishi shart (joylashuv).
 * - "Joylashuv" tugmasi geolocation olib current_point ni yangilaydi.
 * - Realtime UI yozuvlari (Realtime ON, tezroq driver topadi...) yo‘q.
 * - Body type faqat 5 ta variant.
 */

const BODY_TYPES = [
  { value: "motoroller", label: "Motoruller" },
  { value: "labo_damas", label: "Labo / Damas" },
  { value: "gazel", label: "Gazel" },
  { value: "isuzu_kamaz", label: "Isuzu / Kamaz" },
  { value: "fura", label: "Fura" },
];

function normalizePoint(point) {
  // DBda current_point har xil formatda bo‘lishi mumkin: {lat,lng} yoki [lng,lat] yoki "POINT(lng lat)"
  if (!point) return null;

  // { lat, lng }
  if (typeof point === "object" && point.lat != null && point.lng != null) {
    return { lat: Number(point.lat), lng: Number(point.lng) };
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
  // Sizning schema: vehicles.current_point "point" yoki json bo‘lishi mumkin.
  // Oldingi loyihalarda ko‘pincha json {lat,lng} saqlangan.
  // Shuning uchun eng xavfsiz: json saqlaymiz.
  if (!p) return null;
  return { lat: Number(p.lat), lng: Number(p.lng) };
}

export default function DriverFreight() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const [userId, setUserId] = useState(null);

  const [vehicleId, setVehicleId] = useState(null);

  const [title, setTitle] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [bodyType, setBodyType] = useState("gazel");
  const [capacityKg, setCapacityKg] = useState("");
  const [capacityM3, setCapacityM3] = useState("");
  const [isOnline, setIsOnline] = useState(false);

  const [currentPoint, setCurrentPoint] = useState(null);
  const [currentPointText, setCurrentPointText] = useState("—");

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const mountedRef = useRef(false);

  const canGoOnline = useMemo(() => {
    // Online uchun joylashuv shart
    return !!currentPoint;
  }, [currentPoint]);

  const clearMsgs = useCallback(() => {
    setError("");
    setInfo("");
  }, []);

  const loadMe = useCallback(async () => {
    clearMsgs();
    setLoading(true);

    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;

      const uid = authData?.user?.id || null;
      setUserId(uid);

      if (!uid) {
        setLoading(false);
        setError("Login bo‘lmagan: user topilmadi. Iltimos qayta kiring.");
        return;
      }

      // driver_id bo‘yicha oxirgi vehicle
      const { data: vehicles, error: vErr } = await supabase
        .from("vehicles")
        .select(
          "id, driver_id, title, plate_number, body_type, capacity_kg, capacity_m3, is_online, current_point, current_updated_at, updated_at"
        )
        .eq("driver_id", uid)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (vErr) throw vErr;

      const v = vehicles?.[0] || null;

if (!v) {
        // Vehicle yo‘q — form bo‘sh holatda qoladi
        setVehicleId(null);
        setIsOnline(false);
        setCurrentPoint(null);
        setCurrentPointText("—");
        setLoading(false);
        return;
      }

      setVehicleId(v.id || null);
      setTitle(v.title || "");
      setPlateNumber(v.plate_number || "");
      setBodyType(v.body_type || "gazel");
      setCapacityKg(v.capacity_kg != null ? String(v.capacity_kg) : "");
      setCapacityM3(v.capacity_m3 != null ? String(v.capacity_m3) : "");
      setIsOnline(!!v.is_online);

      const p = normalizePoint(v.current_point);
      setCurrentPoint(p);
      setCurrentPointText(p ? ${p.lat.toFixed(6)}, ${p.lng.toFixed(6)} : "—");

      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
      setError(e?.message || "Xatolik yuz berdi (load).");
    }
  }, [clearMsgs]);

  useEffect(() => {
    mountedRef.current = true;
    loadMe();
    return () => {
      mountedRef.current = false;
    };
  }, [loadMe]);

  const saveVehicle = useCallback(async () => {
    clearMsgs();
    setSaving(true);

    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const uid = authData?.user?.id;
      if (!uid) throw new Error("Login bo‘lmagan: user topilmadi.");

      const payload = {
        driver_id: uid,
        title: title?.trim() || null,
        plate_number: plateNumber?.trim() || null,
        body_type: bodyType || "gazel",
        capacity_kg: capacityKg === "" ? null : Number(capacityKg),
        capacity_m3: capacityM3 === "" ? null : Number(capacityM3),
        current_point: pointToDbValue(currentPoint),
        // is_online ni saqlashda ham yuboramiz (UI holati saqlansin)
        is_online: !!isOnline,
        updated_at: new Date().toISOString(),
      };

      // Agar vehicleId bo‘lsa update, bo‘lmasa insert.
      if (vehicleId) {
        const { error: upErr } = await supabase.from("vehicles").update(payload).eq("id", vehicleId);
        if (upErr) throw upErr;
        setInfo("Saqlandi.");
      } else {
        // Eslatma: sizda driver_id bo‘yicha dublikatlar bo‘lishi mumkin.
        // Biz bu yerda oddiy insert qilamiz. Agar dublikat bo‘lib ketgan bo‘lsa keyin DBni tozalash kerak.
        const { data: ins, error: insErr } = await supabase
          .from("vehicles")
          .insert(payload)
          .select("id")
          .limit(1)
          .single();

        if (insErr) throw insErr;

        setVehicleId(ins?.id || null);
        setInfo("Yangi mashina yaratildi va saqlandi.");
      }
    } catch (e) {
      console.error(e);
      setError(e?.message || "Xatolik yuz berdi (save).");
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [bodyType, capacityKg, capacityM3, clearMsgs, currentPoint, isOnline, plateNumber, title, vehicleId]);

  const updateLocation = useCallback(async () => {
    clearMsgs();
    setLocLoading(true);

    try {
      if (!navigator.geolocation) {
        throw new Error("Brauzer geolocation qo‘llamaydi.");
      }

      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const lat = Number(pos?.coords?.latitude);
      const lng = Number(pos?.coords?.longitude);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error("Joylashuv olinmadi (lat/lng).");
      }

      const p = { lat, lng };
      setCurrentPoint(p);
      setCurrentPointText(${lat.toFixed(6)}, ${lng.toFixed(6)});

      // Agar vehicle mavjud bo‘lsa darrov DBga ham yozib qo‘yamiz

if (vehicleId) {
        const { error: upErr } = await supabase
          .from("vehicles")
          .update({
            current_point: pointToDbValue(p),
            current_updated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", vehicleId);

        if (upErr) throw upErr;
      }

      setInfo("Joylashuv yangilandi.");
    } catch (e) {
      console.error(e);
      const msg =
        e?.message ||
        (e?.code === 1
          ? "Joylashuv ruxsati berilmadi."
          : e?.code === 2
          ? "Joylashuv aniqlanmadi."
          : e?.code === 3
          ? "Joylashuv olish vaqti tugadi."
          : "Joylashuv xatosi.");
      setError(msg);
    } finally {
      if (mountedRef.current) setLocLoading(false);
    }
  }, [clearMsgs, vehicleId]);

  const toggleOnline = useCallback(
    async (next) => {
      clearMsgs();

      // Online ON qilish uchun: vehicle bo‘lishi va location bo‘lishi shart
      if (next === true) {
        if (!currentPoint) {
          setError("Online bo‘lish uchun avval Joylashuvni belgilang.");
          return;
        }
        // vehicle yo‘q bo‘lsa avval saqlab (insert) olamiz
        if (!vehicleId) {
          setError("Online yoqishdan oldin avval 'Saqlash' qilib mashinani yaratib oling.");
          return;
        }
      }

      setTogglingOnline(true);

      try {
        if (!vehicleId) {
          setError("Vehicle topilmadi. Avval 'Saqlash' qiling.");
          return;
        }

        const { error: upErr } = await supabase
          .from("vehicles")
          .update({
            is_online: !!next,
            // online bo‘lganda current_updated_at ham yangilansin
            current_updated_at: currentPoint ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", vehicleId);

        if (upErr) throw upErr;

        setIsOnline(!!next);
        setInfo(next ? "Online yoqildi." : "Offline qilindi.");
      } catch (e) {
        console.error(e);
        setError(e?.message || "Online o‘zgartirishda xato.");
      } finally {
        if (mountedRef.current) setTogglingOnline(false);
      }
    },
    [clearMsgs, currentPoint, vehicleId]
  );

  const onlineUiDisabled = useMemo(() => {
    // tugma bosilishi mumkin, lekin ON uchun shartlar bor (toggleOnline ichida tekshiriladi)
    return loading  saving  togglingOnline;
  }, [loading, saving, togglingOnline]);

  const bodyTypeOptions = useMemo(() => BODY_TYPES, []);

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-xl font-semibold">YUK TASHISH (HAYDOVCHI)</div>
          <div className="text-sm opacity-80">
            Mashinani kiriting → joylashuvni belgilang → online bo‘ling → mos yuklar ko‘rinadi.
          </div>
        </div>

        <button
          type="button"
          onClick={updateLocation}
          disabled={loading || locLoading}
          className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50"
        >
          {locLoading ? "Joylashuv olinmoqda..." : "Joylashuv"}
        </button>
      </div>

      {(error || info) && (
        <div className="mb-4 space-y-2">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-900/40 border border-red-500 text-red-100">
              {error}
            </div>
          )}
          {info && (
            <div className="px-4 py-3 rounded-lg bg-green-900/30 border border-green-500 text-green-100">
              {info}
            </div>
          )}
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
              onChange={(e) => setPlateNumber(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 outline-none"
              placeholder="01A123BC"
            />
          </div>

          <div>
            <label className="block text-sm opacity-80 mb-1">Turi</label>
            <select
              value={bodyType}
              onChange={(e) => setBodyType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 outline-none"
            >
              {bodyTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
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

        <div className="mt-3 text-sm opacity-80">
          Online uchun joylashuv kerak. Hozir:{" "}
          <span className="font-mono">{currentPointText}</span>
          {!canGoOnline && <span className="ml-2 text-yellow-300">(Joylashuv belgilanmagan)</span>}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={loadMe}
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
            <div className="text-lg font-semibold">Mos yuklar (board)</div>
            <div className="text-sm opacity-70">Yuklar sizning joylashuvingiz va mashina turiga qarab chiqadi.</div>
          </div>
          <div className="text-sm px-3 py-1 rounded-full border border-white/10">
            {isOnline ? "Online" : "Offline"}
          </div>
        </div>

        {/* Bu yerda sizning oldingi “yuklar ro‘yxati” renderingingiz bo‘lsa,
            shu komponent ichida qoldirishingiz mumkin.
            Men ataylab yangi logika qo‘shmadim — faqat online/vehicle/location muammosini hal qildim. */}
        <div className="text-sm opacity-70 mt-2">
          {isOnline
            ? "Online: mos yuklar ko‘rinishi kerak."
            : "Offline: yuklar ko‘rinmasligi mumkin (haydovchi topilmasin)."}
        </div>
      </div>
    </div>
  );
}