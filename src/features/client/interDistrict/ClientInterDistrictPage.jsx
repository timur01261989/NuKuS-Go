import React, { useEffect, useMemo, useState } from "react";
import { Button, Divider, Drawer, message, Typography } from "antd";
import DistrictHeader from "./components/Header/DistrictHeader";
import DistrictList from "./components/Selection/DistrictList";
import DepartureTime from "./components/Selection/DepartureTime";
import CarSeatSchema from "./components/Seats/CarSeatSchema";
import SeatLegend from "./components/Seats/SeatLegend";
import FilterBar from "./components/Drivers/FilterBar";
import DistrictMap from "./map/DistrictMap";
import { DistrictProvider, useDistrict } from "./context/DistrictContext";
import { useDistrictRoute } from "./map/useDistrictRoute";
import TripCard from "./components/Trips/TripCard";
import RequestTripDrawer from "./components/Trips/RequestTripDrawer";
import { searchTrips, requestTrip, listPitaks } from "@/features/shared/interDistrictTrips";
import { nominatimReverse } from "../shared/geo/nominatim";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * ClientInterDistrictPage.jsx (FULL)
 * -------------------------------------------------------
 * Talab bo‘yicha:
 * - Hudud -> tumanlar (qaerdan/qaerga)
 * - "Manzildan manzilgacha" (door-to-door) + map picker + manzil nomi
 * - OSRM yo‘l chizish + masofa
 * - Sana/soat
 * - O‘rindiq + butun salon (door-to-door)
 * - Filter (konditsioner, yukxona)
 * - Tugma: "Reys izlash"
 * - Natija: haydovchi kiritgan reyslar + "Buyirtma jonatish" (so‘rov)
 */

const pinIcon = (color = "#1677ff") =>
  L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,.25)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

function MapPicker({ open, onClose, initialPoint, onPick }) {
  const [point, setPoint] = useState(initialPoint || null);

  useEffect(() => setPoint(initialPoint || null), [initialPoint?.lat, initialPoint?.lng, open]);

  const center = useMemo(() => {
    if (point) return [point.lat, point.lng];
    return [41.311, 69.2797];
  }, [point]);

  return (
    <Drawer title="Xaritadan tanlash" placement="bottom" height={520} open={open} onClose={onClose}>
      <div style={{ height: 380, borderRadius: 18, overflow: "hidden", border: "1px solid rgba(0,0,0,.08)" }}>
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap &copy; CARTO"
          />
          <MapClickSetter onPoint={(p) => setPoint(p)} />
          {point && <Marker position={[point.lat, point.lng]} icon={pinIcon("#1677ff")} />}
        </MapContainer>
      </div>

      <div style={{ marginTop: 14 }}>
        <Button
          type="primary"
          disabled={!point}
          onClick={() => onPick?.(point)}
          style={{ width: "100%", borderRadius: 16, height: 44 }}
        >
          Manzilni saqlash
        </Button>
        <Button onClick={onClose} style={{ width: "100%", marginTop: 10, borderRadius: 16, height: 44 }}>
          Bekor qilish
        </Button>
      </div>
    </Drawer>
  );
}

function MapClickSetter({ onPoint }) {
  // react-leaflet hook import dynamic to avoid SSR issues in Vercel
  const { useMapEvents } = require("react-leaflet");
  useMapEvents({
    click(e) {
      onPoint?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function Inner({ onBack }) {
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
  } = useDistrict();

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

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState("pickup"); // pickup|dropoff

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
        } catch (_) {}
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
    } catch (_) {
      const fallback = `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
      if (pickerType === "pickup") setPickupAddress(fallback);
      else setDropoffAddress(fallback);
    } finally {
      setPickerOpen(false);
    }
  };

  // search results
  const [searching, setSearching] = useState(false);
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [requestOpen, setRequestOpen] = useState(false);

  const canSearch = useMemo(() => {
    if (!regionId || !fromDistrict || !toDistrict) return false;
    return true;
  }, [regionId, fromDistrict, toDistrict]);

  const departIso = useMemo(() => {
    if (!departDate || !departTime) return null;
    try {
      return new Date(`${departDate}T${departTime}:00`).toISOString();
    } catch {
      return null;
    }
  }, [departDate, departTime]);

  const onSearch = async () => {
    if (!canSearch) return message.error("Hudud va tumanlarni tanlang");
    setSearching(true);
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

      // pitak title ko‘rsatish uchun pitaklarni bir marta olib, map qilamiz
      const pitaks = await listPitaks({ region: regionId, from_district: fromDistrict, to_district: toDistrict, activeOnly: false }).catch(() => []);
      const pitakMap = new Map((pitaks || []).map((p) => [p.id, p.title]));
      const enriched = (list || []).map((t) => ({ ...t, pitak_title: t.pitak_id ? pitakMap.get(t.pitak_id) : null }));
      setTrips(enriched);
    } catch (e) {
      message.error(e?.message || "Xatolik: reyslar topilmadi");
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
      await requestTrip({
        trip_id: selectedTrip.id,
        wants_full_salon: !!payload.wants_full_salon,
        pickup_address: payload.pickup_address || (doorToDoor ? pickupAddress : null),
        dropoff_address: payload.dropoff_address || (doorToDoor ? dropoffAddress : null),
        pickup_point: doorToDoor ? pickupPoint : null,
        dropoff_point: doorToDoor ? (dropoffPoint || null) : null,
        is_delivery: !!payload.is_delivery,
        delivery_notes: payload.delivery_notes || null,
      });
      message.success("So‘rov yuborildi");
      setRequestOpen(false);
    } catch (e) {
      message.error(e?.message || "Xatolik: so‘rov yuborilmadi");
    } finally {
      hide();
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", paddingBottom: 24 }}>
      <DistrictHeader onBack={onBack} />

      <div style={{ padding: "0 14px" }}>
        <DistrictMap
          from={from}
          to={to}
          polyline={routeInfo?.polyline}
          distanceKm={routeInfo?.distanceKm}
          durationMin={routeInfo?.durationMin}
        />

        <div style={{ marginTop: 12 }}>
          <DistrictList onOpenPicker={openPicker} onLocateMe={locateMe} />
        </div>

        <div style={{ marginTop: 12 }}>
          <DepartureTime />
        </div>

        <div style={{ marginTop: 12 }}>
          <CarSeatSchema />
        </div>

        <div style={{ marginTop: 12 }}>
          <SeatLegend />
        </div>

        <div style={{ marginTop: 12 }}>
          <FilterBar />
        </div>

        <Divider />

        <Button
          type="primary"
          loading={searching}
          disabled={!canSearch}
          onClick={onSearch}
          style={{ width: "100%", borderRadius: 16, height: 44 }}
        >
          Reys izlash
        </Button>

        <Typography.Title level={5} style={{ margin: "14px 0 10px" }}>
          Topilgan reyslar
        </Typography.Title>

        {searching ? (
          <div style={{ color: "#666" }}>Qidirilmoqda...</div>
        ) : trips.length ? (
          trips.map((t) => <TripCard key={t.id} trip={t} onRequest={onRequest} />)
        ) : (
          <div style={{ color: "#666" }}>Hozircha reys topilmadi.</div>
        )}
      </div>

      <MapPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        initialPoint={pickerType === "pickup" ? pickupPoint : dropoffPoint}
        onPick={handlePickPoint}
      />

      <RequestTripDrawer
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        trip={selectedTrip}
        defaultPickupAddress={doorToDoor ? pickupAddress : ""}
        defaultDropoffAddress={doorToDoor ? dropoffAddress : ""}
        allowFullSalonDefault={!!seatState?.wantsFullSalon}
        onSubmit={submitRequest}
      />
    </div>
  );
}

export default function ClientInterDistrictPage(props) {
  return (
    <DistrictProvider>
      <Inner {...props} />
    </DistrictProvider>
  );
}
