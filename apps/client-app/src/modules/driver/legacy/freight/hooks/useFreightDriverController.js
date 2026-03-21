import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nominatimReverse } from "@/modules/client/features/client/shared/geo/nominatim.js";
import { supabase } from "@/services/supabase/supabaseClient";
import { useDriverOnline } from "../../core/useDriverOnline";
import { canActivateService } from "../../core/serviceGuards";
import { canUseOrderTypeInArea, clampLoadToVehicle } from "../../core/driverCapabilityService";
import { BODY_TYPES, normalizePoint, pointToDbValue } from "../FreightPage.helpers.jsx";
import { buildHeartbeatMeta } from "@/modules/shared/domain/logistics/realtimeTelemetry.js";

export function useFreightDriverController() {
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
  const clearMsgs = useCallback(() => { setError(""); setInfo(""); }, []);

  const connectionMeta = useMemo(() => ({ state: isOnline ? "live" : "idle", lastEventAt: currentPoint ? new Date().toISOString() : null }), [isOnline, currentPoint]);
  const heartbeatMeta = useMemo(() => buildHeartbeatMeta({ lastEventAt: connectionMeta.lastEventAt, lastLocationAt: currentPoint ? new Date().toISOString() : null }), [connectionMeta, currentPoint]);

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
        };
        setVehicleId(mapped.id || null);
        setTitle(mapped.title || "");
        setPlateNumber((mapped.plate_number || "").toUpperCase().slice(0, 9));
        setBodyType(mapped.body_type || "gazel");
        setCapacityKg(mapped.capacity_kg != null ? String(mapped.capacity_kg) : "");
        setCapacityM3(mapped.capacity_m3 != null ? String(mapped.capacity_m3) : "");
        setIsOnline(!!mapped.is_online && globalOnline && activeService === serviceType);
        setCurrentPoint(null);
        setCurrentAddress("");
        setLoading(false);
        return;
      }
      const { data: vehicles, error: vErr } = await supabase
        .from("vehicles")
        .select("id, user_id, driver_id, title, plate_number, body_type, capacity_kg, capacity_m3, is_online, current_point, updated_at")
        .or(`user_id.eq.${uid},driver_id.eq.${uid}`)
        .order("updated_at", { ascending: false })
        .limit(1);
      if (vErr) throw vErr;
      const v = vehicles?.[0] || null;
      if (!v) {
        setVehicleId(null); setIsOnline(false); setCurrentPoint(null); setCurrentAddress(""); setLoading(false); return;
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
      if (p?.lat != null && p?.lng != null) setCurrentAddress((await nominatimReverse(p.lat, p.lng, { swallowErrors: true })) || "");
      else setCurrentAddress("");
      setLoading(false);
      await Promise.resolve(refreshCapabilities?.()).catch(() => {});
    } catch (e) {
      setLoading(false);
      setError(e?.message || "Xatolik yuz berdi.");
    }
  }, [activeService, activeVehicle, clearMsgs, globalOnline, refreshCapabilities]);

  useEffect(() => {
    mountedRef.current = true;
    loadVehicle();
    return () => { mountedRef.current = false; };
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
        user_id: uid, driver_id: uid, title: title?.trim() || null,
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
        const { data: ins, error: insErr } = await supabase.from("vehicles").insert(payload).select("id").limit(1).single();
        if (insErr) throw insErr;
        setVehicleId(ins?.id || null);
        setInfo("Yangi mashina yaratildi.");
      }
    } catch (e) {
      setError(e?.message || "Saqlashda xato.");
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [bodyType, capacityKg, capacityM3, clearMsgs, currentPoint, globalOnline, activeService, plateNumber, title, vehicleId]);

  const toggleOnline = useCallback(async (next) => {
    clearMsgs();
    if (next === true) {
      if (!canActivateService(activeService, serviceType)) return setError("Avval boshqa xizmatni offline qiling.");
      if (!freightEnabled) return setError("Yuk tashish xizmati Sozlamalarda yoqilmagan.");
      if (!currentPoint && !activeVehicle) return setError("Online bo‘lish uchun avval Joylashuvni xaritadan tanlang.");
      if (!vehicleId) return setError("Online yoqishdan oldin avval 'SAQLASH' qilib mashinani yaratib oling.");
    }
    setTogglingOnline(true);
    try {
      if (!vehicleId) throw new Error("Vehicle topilmadi. Avval 'SAQLASH' qiling.");
      const { error: upErr } = await supabase.from("vehicles").update({
        is_online: !!next,
        current_updated_at: currentPoint ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }).eq("id", vehicleId);
      if (upErr) throw upErr;
      if (next) await setOnline(serviceType); else await setOffline();
      setIsOnline(!!next);
      setInfo(next ? "Online yoqildi." : "Offline qilindi.");
    } catch (e) {
      setError(e?.message || "Online o‘zgartirishda xato.");
    } finally {
      if (mountedRef.current) setTogglingOnline(false);
    }
  }, [activeService, activeVehicle, clearMsgs, currentPoint, freightEnabled, setOffline, setOnline, vehicleId]);

  useEffect(() => { setIsOnline(!!globalOnline && activeService === serviceType); }, [globalOnline, activeService]);

  const onlineUiDisabled = useMemo(() => loading || saving || togglingOnline, [loading, saving, togglingOnline]);
  const plateHint = useMemo(() => {
    const v = plateNumber.trim();
    if (!v) return "Masalan: 01A123BC (9 ta belgigacha)";
    if (v.length > 9) return "Davlat raqami 9 ta belgidan oshmasligi kerak.";
    return "9 ta belgigacha, avtomatik KATTA harf.";
  }, [plateNumber]);

  return {
    BODY_TYPES,
    loading, saving, togglingOnline, onlineUiDisabled, vehicleId,
    title, setTitle, plateNumber, setPlateNumber, bodyType, setBodyType, capacityKg, setCapacityKg, capacityM3, setCapacityM3,
    isOnline, currentPoint, setCurrentPoint, currentAddress, setCurrentAddress, pickerOpen, setPickerOpen,
    error, info, freightEnabled, deliveryEnabled, vehicleLimits, plateHint,
    loadVehicle, saveVehicle, toggleOnline, activeVehicle, supabase,
  };
}