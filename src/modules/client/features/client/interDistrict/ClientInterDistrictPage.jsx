import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/modules/shared/i18n/useLanguage";
import { useClientText } from "../shared/i18n_clientLocalize";
import { Button, Divider, Drawer, message, Typography, Card, Popconfirm } from "antd"; // Card va Popconfirm qo'shildi
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
import { searchTrips, requestTrip, listPitaks } from "@/modules/client/features/shared/interDistrictTrips.js";
import { nominatimReverse } from "../shared/geo/nominatim";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * ClientInterDistrictPage.jsx (FULL)
 * -------------------------------------------------------
 * * "YAGONA REYS" TIZIMI QO'SHIMCHALARI (FINAL):
 * - ActiveTripPanel (Safar boshlanganda chiquvchi oyna) qo'shildi.
 * - Yo'lovchi haydovchiga qo'ng'iroq qilishi yoki GPS tekshiruvi bilan safarni bekor qilishi mumkin.
 * - submitRequest da activeDriver ma'lumotlari saqlanadi.
 */

const pinIcon = (color = "#1677ff") =>
  L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,.25)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

function MapPicker({ open, onClose, initialPoint, onPick }) {
  const { t, cp } = useClientText();
  const [point, setPoint] = useState(initialPoint || null);

  useEffect(() => setPoint(initialPoint || null), [initialPoint?.lat, initialPoint?.lng, open]);

  const center = useMemo(() => {
    if (point) return [point.lat, point.lng];
    return [41.311, 69.2797];
  }, [point]);

  return (
    <Drawer title={t.mapSelect} placement="bottom" height={520} open={open} onClose={onClose}>
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
        >{t.saveAddress}</Button>
        <Button onClick={onClose} style={{ width: "100%", marginTop: 10, borderRadius: 16, height: 44 }}>{t.cancelAction}</Button>
      </div>
    </Drawer>
  );
}

function MapClickSetter({ onPoint }) {
  useMapEvents({
    click(e) {
      onPoint?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// =====================================================================
// YANGI KOMPONENT: AKTIV SAFAR PANELI (Safar qabul qilingandan so'ng chiqadi)
// =====================================================================
function ActiveTripPanel() {
  const { t, cp } = useClientText();
  const { tripStatus, setTripStatus, activeDriver } = useDistrict();

  const handleCancel = () => {
    // API ga cancelTripWithFraudCheck so'rovi ketadi (hozircha UI imitatsiyasi)
    message.loading({ content: `${t.cancelAction}... GPS`, key: "cancel" });
    setTimeout(() => {
      message.error({ content: "Safar bekor qilindi. Agar firibgarlik aniqlansa reyting tushiriladi!", key: "cancel", duration: 4 });
      setTripStatus('IDLE'); // Qayta qidiruv sahifasiga o'tish
    }, 2000);
  };

  return (
    <Card style={{ borderRadius: 18, marginTop: 12, border: "2px solid #1677ff", boxShadow: "0 4px 12px rgba(22, 119, 255, 0.15)" }} bodyStyle={{ padding: 16 }}>
      <Typography.Title level={5} style={{ marginTop: 0 }}>Aktiv Safar</Typography.Title>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: "center", marginTop: 10 }}>
        <div>
          <Typography.Text style={{ fontWeight: 800, fontSize: 16 }}>{activeDriver?.name || "Haydovchi ismi"}</Typography.Text>
          <div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>
            {activeDriver?.car || "Cobalt"} · <b style={{ color: "#333" }}>{activeDriver?.carNumber || "01A 123 AA"}</b>
          </div>
          <div style={{ color: "#fa8c16", fontWeight: 600, marginTop: 4 }}>
            ★ {activeDriver?.rating || "5.0"} Reyting
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Typography.Text style={{ fontSize: 12, color: "#888", display: "block" }}>Safar holati:</Typography.Text>
          <div style={{ fontWeight: 'bold', fontSize: 15, color: tripStatus === 'ON_TRIP' ? '#52c41a' : '#1677ff' }}>
            {tripStatus === 'WAITING_DRIVER' ? 'Qabul qilindi' : tripStatus === 'PICKING_UP' ? 'Kelmoqda' : 'Yo\'lda'}
          </div>
        </div>
      </div>

      <Divider style={{ margin: "14px 0" }} />

      <div style={{ display: "flex", gap: 10 }}>
        <Button 
          type="primary" 
          style={{ flex: 1, borderRadius: 12, height: 44, backgroundColor: "#52c41a", fontWeight: 600 }} 
          href={`tel:${activeDriver?.phone || "+998900000000"}`}
        >
          {t.callDriver || cp("Qo'ng'iroq")}
        </Button>
        <Popconfirm 
          title={cp("Safarni bekor qilasizmi?")} 
          description="GPS orqali haydovchi bilan birga ketayotganingiz aniqlansa jarima yoziladi!"
          onConfirm={handleCancel} 
          okText={cp("Ha, bekor qilish")} 
          cancelText={cp("Yo'q")}
        >
          <Button danger style={{ flex: 1, borderRadius: 12, height: 44, fontWeight: 600 }}>
            {`❌ ${t.cancelAction}`}
          </Button>
        </Popconfirm>
      </div>
    </Card>
  );
}
// =====================================================================

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
    tripStatus,
    setTripStatus,
    setActiveDriver
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
  const [pickerType, setPickerType] = useState("pickup");

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
    
    if(setTripStatus) setTripStatus('SEARCHING'); 

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
    const hide = message.loading(cp("So‘rov yuborilmoqda..."), 0);
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
        weight_category: payload.weight_category || null,
        payment_method: payload.payment_method || 'cash',
        final_price: payload.final_price || 0,
        selected_seats: Array.from(seatState.selected || [])
      });
      message.success("So‘rov yuborildi");
      setRequestOpen(false);
      
      // YANGI: Haydovchi ma'lumotlarini Panel uchun saqlab qolamiz va Statusni o'zgartiramiz
      if(setActiveDriver) {
        setActiveDriver({
          id: selectedTrip.driverId || 'id_1',
          name: selectedTrip.driverName || 'Aziz',
          car: selectedTrip.car_model || 'Cobalt',
          carNumber: selectedTrip.carNumber || '01A 123 AA',
          phone: '+998901234567',
          rating: selectedTrip.driver_rating || '5.0'
        });
      }
      if(setTripStatus) setTripStatus('WAITING_DRIVER');
      
    } catch (e) {
      message.error(e?.message || "Xatolik: so‘rov yuborilmadi");
    } finally {
      hide();
    }
  };

  // Safar boshlangandan so'ng qidiruv formalarini yashirish mantiqini aniqlash
  const isActiveTrip = tripStatus !== 'IDLE' && tripStatus !== 'SEARCHING';

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

        {/* YANGI QISM: Agar safar aktiv bo'lsa Faqat ActiveTripPanel chiqadi, Qidiruv Formalari yashirinadi */}
        {isActiveTrip ? (
          <ActiveTripPanel />
        ) : (
          <>
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
          </>
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
      <div className="unigo-page"><Inner {...props} /></div>
    </DistrictProvider>
  );
}