
import { useEffect, useMemo, useState } from "react";
import { message } from "antd";
import { cancelTripRequest, getClientActiveTrip, searchTrips, requestTrip, listPitaks } from "@/modules/client/features/shared/interDistrictTrips.js";
import { nominatimReverse } from "../../shared/geo/nominatim";
import { INTERDISTRICT_TRIP_STATUS, mapTripStatusToClientStep, normalizeInterDistrictStatus } from "@/modules/shared/interdistrict/domain/interDistrictStatuses";
import { useDistrictRoute } from "../map/useDistrictRoute";
import { buildClientTripTimeline } from "@/modules/shared/interdistrict/domain/interDistrictSignals";

export function useInterDistrictController(state) {
  const {
    regionId,
    fromDistrict,
    toDistrict,
    doorToDoor,
    pickupPoint,
    setPickupPoint,
    pickupAddress,
    setPickupAddress,
    dropoffPoint,
    setDropoffPoint,
    dropoffAddress,
    setDropoffAddress,
    departDate,
    departTime,
    seatState,
    filters,
    routeInfo,
    setRouteInfo,
    tripStatus,
    setTripStatus,
    setActiveDriver,
    setActiveTripRequest,
    setCanonicalTripStatus,
    canonicalTripStatus,
  } = state;

  const { from, to, distanceKm, durationMin, polyline } = useDistrictRoute({
    regionId,
    fromDistrictName: fromDistrict,
    toDistrictName: toDistrict,
    doorToDoor,
    pickupPoint,
    dropoffPoint,
  });

  useEffect(() => {
    setRouteInfo({ distanceKm, durationMin, polyline });
  }, [distanceKm, durationMin, polyline, setRouteInfo]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const active = await getClientActiveTrip();
        if (cancelled || !active) return;
        setActiveTripRequest?.(active);
        setCanonicalTripStatus?.(normalizeInterDistrictStatus(active.status));
        setTripStatus(mapTripStatusToClientStep(active.status));
        if (active?.trip) {
          setActiveDriver?.({
            id: active.trip.user_id || active.trip.driver_id || "driver",
            name: active.trip.driver_name || "Haydovchi",
            car: active.trip.car_model || active.trip.carModel || "Avtomobil",
            carNumber: active.trip.car_number || active.trip.carNumber || "—",
            phone: active.trip.driver_phone || null,
            rating: active.trip.driver_rating || "5.0",
          });
        }
      } catch {
        // restore remains best-effort
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setActiveDriver, setActiveTripRequest, setCanonicalTripStatus, setTripStatus]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState("pickup");
  const [searching, setSearching] = useState(false);
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState([]);

  const openPicker = (type) => {
    setPickerType(type);
    setPickerOpen(true);
  };

  const locateMe = async () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPickupPoint(p);
        try {
          const r = await nominatimReverse(p.lat, p.lng, { swallowErrors: true });
          if (r?.display_name) setPickupAddress(r.display_name);
        } catch {
          // geocoder failure is non-blocking
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handlePickPoint = async (p) => {
    if (pickerType === "pickup") setPickupPoint(p);
    else setDropoffPoint(p);

    try {
      const r = await nominatimReverse(p.lat, p.lng, { swallowErrors: true });
      const name = r?.display_name || `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
      if (pickerType === "pickup") setPickupAddress(name);
      else setDropoffAddress(name);
    } catch {
      const fallback = `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
      if (pickerType === "pickup") setPickupAddress(fallback);
      else setDropoffAddress(fallback);
    } finally {
      setPickerOpen(false);
    }
  };

  const canSearch = useMemo(() => Boolean(regionId && fromDistrict && toDistrict), [regionId, fromDistrict, toDistrict]);

  const departIso = useMemo(() => {
    if (!departDate || !departTime) return null;
    try {
      return new Date(`${departDate}T${departTime}:00`).toISOString();
    } catch {
      return null;
    }
  }, [departDate, departTime]);

  const tripTimeline = useMemo(
    () => buildClientTripTimeline(canonicalTripStatus, state.activeTripRequest),
    [canonicalTripStatus, state.activeTripRequest]
  );

  const onSearch = async () => {
    if (!canSearch) {
      message.error("Hudud va tumanlarni tanlang");
      return;
    }
    setSearching(true);
    setTripStatus?.("SEARCHING");
    try {
      const list = await searchTrips({
        region: regionId,
        from_district: fromDistrict,
        to_district: toDistrict,
        has_ac: filters.ac ? true : undefined,
        has_trunk: filters.trunk ? true : undefined,
        depart_from: departIso ? new Date(new Date(departIso).getTime() - 6 * 3600_000).toISOString() : undefined,
        depart_to: departIso ? new Date(new Date(departIso).getTime() + 24 * 3600_000).toISOString() : undefined,
      });

      const pitaks = await listPitaks({ region: regionId, from_district: fromDistrict, to_district: toDistrict, activeOnly: false }).catch(() => []);
      setSavedRoutes((prev) => {
        const next = [{ regionId, fromDistrict, toDistrict, departIso }, ...prev].filter(Boolean);
        const unique = [];
        const seen = new Set();
        for (const item of next) {
          const key = `${item.regionId}:${item.fromDistrict}:${item.toDistrict}:${item.departIso || "none"}`;
          if (seen.has(key)) continue;
          seen.add(key);
          unique.push(item);
        }
        return unique.slice(0, 5);
      });
      const pitakMap = new Map((pitaks || []).map((p) => [p.id, p.title]));
      setTrips((list || []).map((trip) => ({ ...trip, pitak_title: trip.pitak_id ? pitakMap.get(trip.pitak_id) : null })));
    } catch (error) {
      message.error(error?.message || "Xatolik: reyslar topilmadi");
      setTrips([]);
    } finally {
      setSearching(false);
    }
  };

  const onRequest = (trip) => {
    setSelectedTrip(trip);
    setRequestOpen(true);
  };

  const submitRequest = async (payload) => {
    if (!selectedTrip) return;
    const hide = message.loading("So‘rov yuborilmoqda...", 0);
    try {
      const createdRequest = await requestTrip({
        trip_id: selectedTrip.id,
        wants_full_salon: !!payload.wants_full_salon,
        pickup_address: payload.pickup_address || (doorToDoor ? pickupAddress : null),
        dropoff_address: payload.dropoff_address || (doorToDoor ? dropoffAddress : null),
        pickup_point: doorToDoor ? pickupPoint : null,
        dropoff_point: doorToDoor ? (dropoffPoint || null) : null,
        is_delivery: !!payload.is_delivery,
        delivery_notes: payload.delivery_notes || null,
        weight_category: payload.weight_category || null,
        payment_method: payload.payment_method || "cash",
        final_price: payload.final_price || 0,
        selected_seats: Array.from(seatState.selected || []),
      });
      message.success("So‘rov yuborildi");
      setRequestOpen(false);
      setActiveDriver?.({
        id: selectedTrip.driverId || "id_1",
        name: selectedTrip.driverName || "Aziz",
        car: selectedTrip.car_model || "Cobalt",
        carNumber: selectedTrip.carNumber || "01A 123 AA",
        phone: "+998901234567",
        rating: selectedTrip.driver_rating || "5.0",
      });
      setActiveTripRequest?.(createdRequest);
      setCanonicalTripStatus?.(INTERDISTRICT_TRIP_STATUS.MATCHED);
      setTripStatus?.(mapTripStatusToClientStep(INTERDISTRICT_TRIP_STATUS.MATCHED));
    } catch (error) {
      message.error(error?.message || "Xatolik: so‘rov yuborilmadi");
    } finally {
      hide();
    }
  };

  const handleCancelActiveTrip = async () => {
    // kept for future orchestration parity
  };

  const isActiveTrip = canonicalTripStatus
    ? canonicalTripStatus !== INTERDISTRICT_TRIP_STATUS.DRAFT && canonicalTripStatus !== INTERDISTRICT_TRIP_STATUS.SEARCHING
    : tripStatus !== "IDLE" && tripStatus !== "SEARCHING";

  return {
    from,
    to,
    routeInfo,
    pickerOpen,
    setPickerOpen,
    pickerType,
    openPicker,
    locateMe,
    handlePickPoint,
    searching,
    trips,
    selectedTrip,
    requestOpen,
    setRequestOpen,
    canSearch,
    onSearch,
    onRequest,
    submitRequest,
    isActiveTrip,
    tripTimeline,
    savedRoutes,
  };
}
