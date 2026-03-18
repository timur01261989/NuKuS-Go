
import React, { useMemo, useState, useEffect } from "react";
import { Button, Drawer, Card, Space, Tag, Typography } from "antd";
import DistrictHeader from "./components/Header/DistrictHeader";
import DistrictMap from "./map/DistrictMap";
import RequestTripDrawer from "./components/Trips/RequestTripDrawer";
import { DistrictProvider, useDistrict } from "./context/DistrictContext";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useInterDistrictController } from "./hooks/useInterDistrictController";
import InterDistrictActiveTripPanel from "./components/InterDistrictActiveTripPanel";
import InterDistrictSearchPanel from "./components/InterDistrictSearchPanel";
import InterDistrictResultsSection from "./components/InterDistrictResultsSection";

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
  const center = useMemo(() => (point ? [point.lat, point.lng] : [41.311, 69.2797]), [point]);
  return (
    <Drawer title="Xaritadan tanlash" placement="bottom" height={520} open={open} onClose={onClose}>
      <div style={{ height: 380, borderRadius: 18, overflow: "hidden", border: "1px solid rgba(0,0,0,.08)" }}>
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap &copy; CARTO"
          />
          <MapClickSetter onPoint={(value) => setPoint(value)} />
          {point && <Marker position={[point.lat, point.lng]} icon={pinIcon("#1677ff")} />}
        </MapContainer>
      </div>
      <div style={{ marginTop: 14 }}>
        <Button type="primary" disabled={!point} onClick={() => onPick?.(point)} style={{ width: "100%", borderRadius: 16, height: 44 }}>
          Saqlash
        </Button>
        <Button onClick={onClose} style={{ width: "100%", marginTop: 10, borderRadius: 16, height: 44 }}>
          Bekor qilish
        </Button>
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

function Inner({ onBack }) {
  const district = useDistrict();
  const controller = useInterDistrictController(district);
  const {
    from,
    to,
    routeInfo,
    openPicker,
    locateMe,
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
    savedRoutes,
    pickerOpen,
    setPickerOpen,
    pickerType,
    handlePickPoint,
  } = controller;
  const { pickupPoint, dropoffPoint, pickupAddress, dropoffAddress, doorToDoor, seatState } = district;

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
        {isActiveTrip ? (
          <InterDistrictActiveTripPanel />
        ) : (
          <>
            {savedRoutes?.length ? (
              <Card size="small" style={{ borderRadius: 16, marginBottom: 12 }}>
                <Typography.Text strong>Saqlangan yo‘nalishlar</Typography.Text>
                <Space wrap style={{ display: "flex", marginTop: 8 }}>
                  {savedRoutes.map((item, idx) => (
                    <Tag key={`${item.fromDistrict}-${item.toDistrict}-${idx}`} color="blue">
                      {item.fromDistrict} → {item.toDistrict}
                    </Tag>
                  ))}
                </Space>
              </Card>
            ) : null}
            <InterDistrictSearchPanel
              openPicker={openPicker}
              locateMe={locateMe}
              searching={searching}
              canSearch={canSearch}
              onSearch={onSearch}
            />
            <InterDistrictResultsSection searching={searching} trips={trips} onRequest={onRequest} />
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
